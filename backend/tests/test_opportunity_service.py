from __future__ import annotations

from app.opportunity_models import OpportunityType, SourceType
from app.opportunity_schemas import OpportunityCreate
from app.opportunity_service import OpportunityService


class FakeQuery:
    def __init__(self, model, store):
        self.model = model
        self.store = store
        self._filters = []

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def first(self):
        if self.model.__name__ == "Opportunity":
            return self.store.get("opportunity")
        return None

    def all(self):
        if self.model.__name__ == "Opportunity":
            opp = self.store.get("opportunity")
            return [opp] if opp else []
        return []


class FakeDB:
    def __init__(self):
        self.store = {}
        self.added = []

    def query(self, model):
        return FakeQuery(model, self.store)

    def add(self, obj):
        self.added.append(obj)
        if hasattr(obj, "id") and not obj.id:
            obj.id = "opp-1"
        self.store["opportunity"] = obj

    def commit(self):
        pass

    def refresh(self, obj):
        pass


def test_create_opportunity_sets_manual_defaults():
    db = FakeDB()
    service = OpportunityService(db)
    payload = OpportunityCreate(
        title="Frontend Intern",
        company="Nexus Labs",
        required_skills=["React", "TypeScript"],
        opportunity_type=OpportunityType.INTERNSHIP,
        source_type=SourceType.MANUAL,
    )
    opp = service.create_opportunity(payload)
    assert opp.title == "Frontend Intern"
    assert opp.source_type == SourceType.MANUAL.value
    assert opp.source_name == "Manual"
