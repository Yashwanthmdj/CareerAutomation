from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Set

from fastapi import HTTPException, status
from sqlalchemy import String, cast, or_
from sqlalchemy.orm import Session

from .opportunity_models import Opportunity, OpportunityType, SavedOpportunity, SourceType
from .opportunity_schemas import OpportunityCreate, OpportunityOut

SOURCE_LABELS = {
    SourceType.WHATSAPP: "WhatsApp",
    SourceType.LINKEDIN: "LinkedIn",
    SourceType.INTERNSHALA: "Internshala",
    SourceType.UNSTOP: "Unstop",
    SourceType.WELLFOUND: "Wellfound",
    SourceType.THUB: "T-Hub",
    SourceType.STUDENT_TRIBE: "Student Tribe",
    SourceType.MANUAL: "Manual",
}


class OpportunityService:
    def __init__(self, db: Session):
        self.db = db

    def _saved_ids_for_user(self, user_id: str) -> Set[str]:
        rows = self.db.query(SavedOpportunity.opportunity_id).filter(SavedOpportunity.user_id == user_id).all()
        return {row[0] for row in rows}

    def _to_out(self, opportunity: Opportunity, saved_ids: Set[str]) -> OpportunityOut:
        return OpportunityOut(
            id=opportunity.id,
            title=opportunity.title,
            company=opportunity.company,
            source_name=opportunity.source_name,
            source_type=SourceType(opportunity.source_type),
            description=opportunity.description,
            apply_link=opportunity.apply_link,
            location=opportunity.location,
            deadline=opportunity.deadline,
            required_skills=opportunity.required_skills or [],
            opportunity_type=OpportunityType(opportunity.opportunity_type),
            created_at=opportunity.created_at,
            updated_at=opportunity.updated_at,
            is_saved=opportunity.id in saved_ids,
        )

    def create_opportunity(self, payload: OpportunityCreate) -> Opportunity:
        source_name = payload.source_name or SOURCE_LABELS.get(payload.source_type, payload.source_type.value)
        opportunity = Opportunity(
            title=payload.title.strip(),
            company=payload.company.strip(),
            source_name=source_name,
            source_type=payload.source_type.value,
            description=payload.description,
            apply_link=payload.apply_link,
            location=payload.location,
            deadline=payload.deadline,
            required_skills=[skill.strip() for skill in payload.required_skills if skill.strip()],
            opportunity_type=payload.opportunity_type.value,
        )
        self.db.add(opportunity)
        self.db.commit()
        self.db.refresh(opportunity)
        return opportunity

    def list_opportunities(
        self,
        user_id: str,
        *,
        search: Optional[str] = None,
        source_type: Optional[SourceType] = None,
        opportunity_type: Optional[OpportunityType] = None,
        saved_only: bool = False,
    ) -> tuple[List[OpportunityOut], int]:
        saved_ids = self._saved_ids_for_user(user_id)
        query = self.db.query(Opportunity)

        if saved_only:
            if not saved_ids:
                return [], 0
            query = query.filter(Opportunity.id.in_(saved_ids))

        if source_type:
            query = query.filter(Opportunity.source_type == source_type.value)

        if opportunity_type:
            query = query.filter(Opportunity.opportunity_type == opportunity_type.value)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Opportunity.title.ilike(term),
                    Opportunity.company.ilike(term),
                    cast(Opportunity.required_skills, String).ilike(term),
                )
            )

        rows = query.order_by(Opportunity.created_at.desc()).all()
        items = [self._to_out(row, saved_ids) for row in rows]
        return items, len(items)

    def get_opportunity(self, opportunity_id: str, user_id: str) -> OpportunityOut:
        opportunity = self.db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
        if not opportunity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
        saved_ids = self._saved_ids_for_user(user_id)
        return self._to_out(opportunity, saved_ids)

    def delete_opportunity(self, opportunity_id: str) -> None:
        opportunity = self.db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
        if not opportunity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
        self.db.delete(opportunity)
        self.db.commit()

    def save_opportunity(self, user_id: str, opportunity_id: str) -> SavedOpportunity:
        opportunity = self.db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
        if not opportunity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")

        existing = (
            self.db.query(SavedOpportunity)
            .filter(
                SavedOpportunity.user_id == user_id,
                SavedOpportunity.opportunity_id == opportunity_id,
            )
            .first()
        )
        if existing:
            return existing

        saved = SavedOpportunity(user_id=user_id, opportunity_id=opportunity_id)
        self.db.add(saved)
        self.db.commit()
        self.db.refresh(saved)
        return saved

    def unsave_opportunity(self, user_id: str, opportunity_id: str) -> None:
        saved = (
            self.db.query(SavedOpportunity)
            .filter(
                SavedOpportunity.user_id == user_id,
                SavedOpportunity.opportunity_id == opportunity_id,
            )
            .first()
        )
        if not saved:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved opportunity not found")
        self.db.delete(saved)
        self.db.commit()

    def list_saved(self, user_id: str) -> tuple[List[tuple[SavedOpportunity, OpportunityOut]], int]:
        saved_ids = self._saved_ids_for_user(user_id)
        rows = (
            self.db.query(SavedOpportunity)
            .filter(SavedOpportunity.user_id == user_id)
            .order_by(SavedOpportunity.saved_at.desc())
            .all()
        )
        results: List[tuple[SavedOpportunity, OpportunityOut]] = []
        for row in rows:
            if not row.opportunity:
                continue
            results.append((row, self._to_out(row.opportunity, saved_ids)))
        return results, len(results)
