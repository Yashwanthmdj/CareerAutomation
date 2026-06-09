from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.opportunity_ingestion_service import (
    OpportunityIngestionService,
    normalize_apply_link,
    normalize_text,
)
from app.opportunity_models import Opportunity, OpportunityType, SourceType
from app.opportunity_schemas import OpportunityCreate


def _make_opportunity(**kwargs) -> Opportunity:
    defaults = {
        "id": "opp-existing",
        "title": "Frontend Intern",
        "company": "Nexus Labs",
        "source_name": "Internshala",
        "source_type": SourceType.INTERNSHALA.value,
        "description": None,
        "apply_link": "https://www.internshala.com/jobs/detail/123",
        "location": "Remote",
        "deadline": None,
        "required_skills": ["React"],
        "opportunity_type": OpportunityType.INTERNSHIP.value,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return Opportunity(**defaults)


class FakeQuery:
    def __init__(self, model, store):
        self.model = model
        self.store = store
        self._company_filter = None
        self._title_filter = None
        self._is_column_query = not hasattr(model, "__name__")

    def filter(self, *args, **kwargs):
        for arg in args:
            left = getattr(arg, "left", None)
            right = getattr(arg, "right", None)
            if left is not None and hasattr(left, "key"):
                if left.key == "company":
                    self._company_filter = right.value
                if left.key == "title":
                    self._title_filter = right.value
        return self

    def all(self):
        if self._is_column_query:
            return []
        if getattr(self.model, "__name__", "") != "Opportunity":
            return []
        opp = self.store.get("opportunity")
        if not opp:
            return []
        if self._company_filter and opp.company.lower() != self._company_filter.lower():
            return []
        if self._title_filter and opp.title.lower() != self._title_filter.lower():
            return []
        return [opp]

    def first(self):
        rows = self.all()
        return rows[0] if rows else None


class FakeDB:
    def __init__(self, existing: Optional[Opportunity] = None):
        self.store = {"opportunity": existing} if existing else {}
        self.added = []

    def query(self, model):
        return FakeQuery(model, self.store)

    def add(self, obj):
        self.added.append(obj)
        if hasattr(obj, "id") and not getattr(obj, "id", None):
            obj.id = "opp-new"
        self.store["opportunity"] = obj

    def commit(self):
        pass

    def refresh(self, obj):
        pass


def test_normalize_text_and_apply_link():
    assert normalize_text("  Frontend   Intern  ") == "frontend intern"
    assert normalize_apply_link("https://www.example.com/apply/") == "example.com/apply"
    assert normalize_apply_link("http://Example.com/apply") == "example.com/apply"


def test_normalize_opportunity_strips_fields():
    service = OpportunityIngestionService(FakeDB())
    normalized = service.normalize_opportunity(
        OpportunityCreate(
            title="  AI Intern  ",
            company="  Nexus Labs ",
            apply_link="https://www.linkedin.com/jobs/view/1/",
            source_type=SourceType.LINKEDIN,
            required_skills=[" Python ", "ML"],
            opportunity_type=OpportunityType.INTERNSHIP,
        )
    )
    assert normalized.title == "AI Intern"
    assert normalized.company == "Nexus Labs"
    assert normalized.apply_link == "linkedin.com/jobs/view/1"
    assert normalized.required_skills == ["Python", "ML"]


def test_deduplicate_matches_company_title_apply_link():
    existing = _make_opportunity()
    service = OpportunityIngestionService(FakeDB(existing))
    normalized = service.normalize_opportunity(
        OpportunityCreate(
            title="frontend intern",
            company="nexus labs",
            apply_link="https://internshala.com/jobs/detail/123",
            source_type=SourceType.INTERNSHALA,
            opportunity_type=OpportunityType.INTERNSHIP,
        )
    )
    match = service.deduplicate_opportunity(normalized)
    assert match is not None
    assert match.id == "opp-existing"


def test_ingest_returns_duplicate_without_creating_new():
    existing = _make_opportunity()
    db = FakeDB(existing)
    service = OpportunityIngestionService(db)
    result = service.ingest_opportunity(
        OpportunityCreate(
            title="Frontend Intern",
            company="Nexus Labs",
            apply_link="https://internshala.com/jobs/detail/123",
            source_type=SourceType.INTERNSHALA,
            opportunity_type=OpportunityType.INTERNSHIP,
        ),
        user_id="user-1",
    )
    assert result.is_duplicate is True
    assert result.opportunity.id == "opp-existing"
    assert len(db.added) == 0
