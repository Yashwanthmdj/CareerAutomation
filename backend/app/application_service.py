from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .application_models import Application, ApplicationStatus
from .application_schemas import (
    ApplicationCreate,
    ApplicationDashboardMetrics,
    ApplicationFunnelStage,
    ApplicationOut,
    ApplicationStatusUpdate,
)
from .models import User
from .opportunity_matching_service import OpportunityMatchingService
from .opportunity_models import Opportunity
from .opportunity_service import OpportunityService

_STATUS_TIMESTAMP_FIELD = {
    ApplicationStatus.APPLIED: "applied_at",
    ApplicationStatus.ASSESSMENT: "assessment_at",
    ApplicationStatus.INTERVIEW: "interview_at",
    ApplicationStatus.OFFER: "offer_at",
    ApplicationStatus.REJECTED: "rejected_at",
}

_FUNNEL_STAGES = [
    ApplicationStatus.SAVED,
    ApplicationStatus.APPLIED,
    ApplicationStatus.ASSESSMENT,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
]

_FUNNEL_LABELS = {
    ApplicationStatus.SAVED: "Saved",
    ApplicationStatus.APPLIED: "Applied",
    ApplicationStatus.ASSESSMENT: "Assessment",
    ApplicationStatus.INTERVIEW: "Interview",
    ApplicationStatus.OFFER: "Offer",
    ApplicationStatus.REJECTED: "Rejected",
}


class ApplicationService:
    def __init__(self, db: Session):
        self.db = db
        self._opportunities = OpportunityService(db)
        self._matching = OpportunityMatchingService(db)

    def _get_opportunity_or_404(self, opportunity_id: str) -> Opportunity:
        opportunity = self.db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
        if not opportunity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
        return opportunity

    def _get_application_or_404(self, application_id: str, user_id: str) -> Application:
        application = (
            self.db.query(Application)
            .filter(Application.id == application_id, Application.user_id == user_id)
            .first()
        )
        if not application:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        return application

    def _to_out(self, application: Application, user: User) -> ApplicationOut:
        opportunity_out = self._opportunities.get_opportunity(application.opportunity_id, user.id)
        match_score: Optional[int] = None
        match_level: Optional[str] = None
        try:
            match = self._matching.get_match_for_opportunity(user, application.opportunity_id)
            if match.analysis_ready:
                match_score = match.match_score
                match_level = match.match_level
        except HTTPException:
            pass

        return ApplicationOut(
            id=application.id,
            user_id=application.user_id,
            opportunity_id=application.opportunity_id,
            status=ApplicationStatus(application.status),
            notes=application.notes,
            applied_at=application.applied_at,
            assessment_at=application.assessment_at,
            interview_at=application.interview_at,
            offer_at=application.offer_at,
            rejected_at=application.rejected_at,
            created_at=application.created_at,
            updated_at=application.updated_at,
            opportunity=opportunity_out,
            match_score=match_score,
            match_level=match_level,
        )

    def create_application(self, user: User, payload: ApplicationCreate) -> ApplicationOut:
        self._get_opportunity_or_404(payload.opportunity_id)

        existing = (
            self.db.query(Application)
            .filter(
                Application.user_id == user.id,
                Application.opportunity_id == payload.opportunity_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Application already tracked for this opportunity.",
            )

        application = Application(
            user_id=user.id,
            opportunity_id=payload.opportunity_id,
            status=ApplicationStatus.SAVED.value,
            notes=payload.notes.strip() if payload.notes else None,
        )
        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)
        return self._to_out(application, user)

    def update_status(
        self,
        user: User,
        application_id: str,
        payload: ApplicationStatusUpdate,
    ) -> ApplicationOut:
        application = self._get_application_or_404(application_id, user.id)
        new_status = payload.status

        application.status = new_status.value
        application.updated_at = datetime.now(timezone.utc)

        timestamp_field = _STATUS_TIMESTAMP_FIELD.get(new_status)
        if timestamp_field:
            setattr(application, timestamp_field, datetime.now(timezone.utc))

        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)
        return self._to_out(application, user)

    def get_user_applications(self, user: User) -> List[ApplicationOut]:
        rows = (
            self.db.query(Application)
            .filter(Application.user_id == user.id)
            .order_by(Application.updated_at.desc())
            .all()
        )
        return [self._to_out(row, user) for row in rows]

    def get_application(self, user: User, application_id: str) -> ApplicationOut:
        application = self._get_application_or_404(application_id, user.id)
        return self._to_out(application, user)

    def delete_application(self, user: User, application_id: str) -> None:
        application = self._get_application_or_404(application_id, user.id)
        self.db.delete(application)
        self.db.commit()

    def get_tracked_opportunity_ids(self, user_id: str) -> set[str]:
        rows = self.db.query(Application.opportunity_id).filter(Application.user_id == user_id).all()
        return {row[0] for row in rows}

    def get_dashboard_metrics(self, user: User) -> ApplicationDashboardMetrics:
        rows = self.db.query(Application).filter(Application.user_id == user.id).all()
        total = len(rows)

        active_statuses = {
            ApplicationStatus.SAVED.value,
            ApplicationStatus.APPLIED.value,
            ApplicationStatus.ASSESSMENT.value,
            ApplicationStatus.INTERVIEW.value,
        }
        active = sum(1 for row in rows if row.status in active_statuses)
        interviews = sum(1 for row in rows if row.status == ApplicationStatus.INTERVIEW.value)
        offers = sum(1 for row in rows if row.status == ApplicationStatus.OFFER.value)
        rejected = sum(1 for row in rows if row.status == ApplicationStatus.REJECTED.value)

        terminal = offers + rejected
        success_rate = round((offers / terminal) * 100, 1) if terminal > 0 else 0.0
        interview_rate = round((interviews / total) * 100, 1) if total > 0 else 0.0
        offer_rate = round((offers / total) * 100, 1) if total > 0 else 0.0

        funnel = [
            ApplicationFunnelStage(
                stage=stage,
                label=_FUNNEL_LABELS[stage],
                count=sum(1 for row in rows if row.status == stage.value),
            )
            for stage in _FUNNEL_STAGES
        ]

        return ApplicationDashboardMetrics(
            active_applications=active,
            interviews=interviews,
            offers=offers,
            rejected=rejected,
            success_rate=success_rate,
            interview_rate=interview_rate,
            offer_rate=offer_rate,
            applications_count=total,
            funnel=funnel,
        )
