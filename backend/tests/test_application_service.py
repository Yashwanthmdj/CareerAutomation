from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

import pytest
from fastapi import HTTPException

from app.application_models import Application, ApplicationStatus
from app.application_schemas import ApplicationCreate, ApplicationOut, ApplicationStatusUpdate
from app.application_service import ApplicationService
from app.opportunity_models import Opportunity, OpportunityType, SourceType
from app.opportunity_schemas import OpportunityOut


def _make_user(user_id: str = "user-1"):
    return type("User", (), {"id": user_id})()


def _make_opportunity(**kwargs) -> Opportunity:
    now = datetime.now(timezone.utc)
    defaults = {
        "id": "opp-1",
        "title": "AI Engineer Intern",
        "company": "Nexus Labs",
        "source_name": "Internshala",
        "source_type": SourceType.INTERNSHALA.value,
        "description": None,
        "apply_link": "https://example.com/apply",
        "location": "Remote",
        "deadline": None,
        "required_skills": ["Python"],
        "opportunity_type": OpportunityType.INTERNSHIP.value,
        "created_at": now,
        "updated_at": now,
    }
    defaults.update(kwargs)
    return Opportunity(**defaults)


def _make_application(**kwargs) -> Application:
    now = datetime.now(timezone.utc)
    defaults = {
        "id": "app-1",
        "user_id": "user-1",
        "opportunity_id": "opp-1",
        "status": ApplicationStatus.SAVED.value,
        "notes": None,
        "applied_at": None,
        "assessment_at": None,
        "interview_at": None,
        "offer_at": None,
        "rejected_at": None,
        "created_at": now,
        "updated_at": now,
    }
    defaults.update(kwargs)
    return Application(**defaults)


class FakeQuery:
    def __init__(self, model, store):
        self.model = model
        self.store = store
        self._filters = []
        self._is_column_query = not hasattr(model, "__name__")

    def filter(self, *args, **_kwargs):
        for arg in args:
            left = getattr(arg, "left", None)
            right = getattr(arg, "right", None)
            if left is not None and hasattr(left, "key") and right is not None:
                self._filters.append((left.key, right.value))
        return self

    def order_by(self, *_args, **_kwargs):
        return self

    def all(self):
        if self._is_column_query:
            model_name = getattr(self.model, "key", None) or getattr(self.model, "name", None)
            if model_name == "opportunity_id":
                return [(row.opportunity_id,) for row in self.store.get("applications", [])]
            return []

        model_name = getattr(self.model, "__name__", "")
        if model_name == "Opportunity":
            rows = list(self.store.get("opportunities", {}).values())
        elif model_name == "Application":
            rows = list(self.store.get("applications", []))
        elif model_name == "User":
            rows = [self.store["user"]] if self.store.get("user") else []
        else:
            rows = []

        for key, value in self._filters:
            if key == "id":
                rows = [row for row in rows if getattr(row, "id", None) == value]
            if key == "user_id":
                rows = [row for row in rows if getattr(row, "user_id", None) == value]
            if key == "opportunity_id":
                rows = [row for row in rows if getattr(row, "opportunity_id", None) == value]
        return rows

    def first(self):
        rows = self.all()
        return rows[0] if rows else None


def _mock_to_out(service: ApplicationService, application: Application, _user) -> ApplicationOut:
    opportunity = service.db.store["opportunities"][application.opportunity_id]
    opportunity_out = OpportunityOut(
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
        is_saved=False,
    )
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
        match_score=82,
        match_level="STRONG",
    )


class FakeDB:
    def __init__(self, opportunity: Optional[Opportunity] = None, applications=None):
        self.store = {
            "opportunities": {opportunity.id: opportunity} if opportunity else {},
            "applications": applications or [],
        }
        self.deleted = []

    def query(self, model):
        return FakeQuery(model, self.store)

    def add(self, obj):
        if isinstance(obj, Application):
            if not getattr(obj, "id", None):
                obj.id = f"app-{len(self.store['applications']) + 1}"
            now = datetime.now(timezone.utc)
            if obj.created_at is None:
                obj.created_at = now
            if obj.updated_at is None:
                obj.updated_at = now
            self.store["applications"].append(obj)

    def delete(self, obj):
        self.deleted.append(obj)
        self.store["applications"] = [row for row in self.store["applications"] if row.id != obj.id]

    def commit(self):
        pass

    def refresh(self, obj):
        pass


@pytest.fixture
def service_with_opportunity(monkeypatch):
    service = ApplicationService(FakeDB(_make_opportunity()))
    monkeypatch.setattr(service, "_to_out", lambda app, user: _mock_to_out(service, app, user))
    return service


def test_create_application(service_with_opportunity):
    user = _make_user()
    result = service_with_opportunity.create_application(
        user,
        ApplicationCreate(opportunity_id="opp-1"),
    )
    assert result.status == ApplicationStatus.SAVED
    assert result.opportunity.id == "opp-1"
    assert len(service_with_opportunity.db.store["applications"]) == 1


def test_create_application_duplicate_conflict(service_with_opportunity):
    user = _make_user()
    service_with_opportunity.create_application(user, ApplicationCreate(opportunity_id="opp-1"))
    with pytest.raises(HTTPException) as exc:
        service_with_opportunity.create_application(user, ApplicationCreate(opportunity_id="opp-1"))
    assert exc.value.status_code == 409


def test_update_status_sets_applied_timestamp(service_with_opportunity):
    user = _make_user()
    created = service_with_opportunity.create_application(user, ApplicationCreate(opportunity_id="opp-1"))
    updated = service_with_opportunity.update_status(
        user,
        created.id,
        ApplicationStatusUpdate(status=ApplicationStatus.APPLIED),
    )
    assert updated.status == ApplicationStatus.APPLIED
    assert updated.applied_at is not None


def test_update_status_sets_interview_timestamp(service_with_opportunity):
    user = _make_user()
    created = service_with_opportunity.create_application(user, ApplicationCreate(opportunity_id="opp-1"))
    updated = service_with_opportunity.update_status(
        user,
        created.id,
        ApplicationStatusUpdate(status=ApplicationStatus.INTERVIEW),
    )
    assert updated.status == ApplicationStatus.INTERVIEW
    assert updated.interview_at is not None


def test_get_user_applications_returns_only_user_rows(monkeypatch):
    opp = _make_opportunity()
    db = FakeDB(
        opp,
        applications=[
            _make_application(id="app-1", user_id="user-1"),
            _make_application(id="app-2", user_id="user-2", opportunity_id="opp-1"),
        ],
    )
    service = ApplicationService(db)
    monkeypatch.setattr(service, "_to_out", lambda app, user: _mock_to_out(service, app, user))
    rows = service.get_user_applications(_make_user("user-1"))
    assert len(rows) == 1
    assert rows[0].id == "app-1"


def test_delete_application(service_with_opportunity):
    user = _make_user()
    created = service_with_opportunity.create_application(user, ApplicationCreate(opportunity_id="opp-1"))
    service_with_opportunity.delete_application(user, created.id)
    assert len(service_with_opportunity.db.store["applications"]) == 0


def test_dashboard_metrics_active_applications():
    opp = _make_opportunity()
    db = FakeDB(
        opp,
        applications=[
            _make_application(id="a1", status=ApplicationStatus.SAVED.value),
            _make_application(id="a2", status=ApplicationStatus.APPLIED.value),
            _make_application(id="a3", status=ApplicationStatus.INTERVIEW.value),
            _make_application(id="a4", status=ApplicationStatus.OFFER.value),
            _make_application(id="a5", status=ApplicationStatus.REJECTED.value),
        ],
    )
    metrics = ApplicationService(db).get_dashboard_metrics(_make_user())
    assert metrics.active_applications == 3
    assert metrics.interviews == 1
    assert metrics.offers == 1
    assert metrics.rejected == 1
    assert metrics.applications_count == 5


def test_dashboard_success_rate():
    opp = _make_opportunity()
    db = FakeDB(
        opp,
        applications=[
            _make_application(id="a1", status=ApplicationStatus.OFFER.value),
            _make_application(id="a2", status=ApplicationStatus.OFFER.value),
            _make_application(id="a3", status=ApplicationStatus.REJECTED.value),
            _make_application(id="a4", status=ApplicationStatus.REJECTED.value),
        ],
    )
    metrics = ApplicationService(db).get_dashboard_metrics(_make_user())
    assert metrics.success_rate == 50.0


def test_dashboard_offer_and_interview_rates():
    opp = _make_opportunity()
    db = FakeDB(
        opp,
        applications=[
            _make_application(id="a1", status=ApplicationStatus.INTERVIEW.value),
            _make_application(id="a2", status=ApplicationStatus.OFFER.value),
            _make_application(id="a3", status=ApplicationStatus.SAVED.value),
            _make_application(id="a4", status=ApplicationStatus.APPLIED.value),
        ],
    )
    metrics = ApplicationService(db).get_dashboard_metrics(_make_user())
    assert metrics.interview_rate == 25.0
    assert metrics.offer_rate == 25.0
    assert len(metrics.funnel) == 5
    assert metrics.funnel[0].count == 1
