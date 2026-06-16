from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.opportunity_models import Opportunity, OpportunityType, SourceType
from app.sources.connectors import CareerPageConnector, CommunityConnector, StartupJobsConnector
from app.sources.source_models import ConnectorKind, HealthStatus, OpportunitySource
from app.sources.source_registry import SOURCE_SEEDS
from app.sources.source_service import SourceService, seed_sources_in_session


def _make_opportunity(**kwargs) -> Opportunity:
    defaults = {
        "id": "opp-existing",
        "title": "Software Engineering Intern — Google Careers",
        "company": "Google",
        "source_name": "Google Careers",
        "source_type": SourceType.MANUAL.value,
        "description": None,
        "apply_link": "https://careers.google.com/jobs/google-swe-intern",
        "location": "Remote / Hybrid",
        "deadline": None,
        "required_skills": ["Python", "Algorithms"],
        "opportunity_type": OpportunityType.INTERNSHIP.value,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return Opportunity(**defaults)


def _seed_sources() -> list[OpportunitySource]:
    now = datetime.now(timezone.utc)
    rows = []
    for seed in SOURCE_SEEDS:
        rows.append(
            OpportunitySource(
                source_id=seed["source_id"],
                source_name=seed["source_name"],
                connector_kind=seed["connector_kind"],
                source_type=seed["source_type"],
                enabled=seed.get("enabled", True),
                health_status=HealthStatus.UNKNOWN.value,
                feed_url=seed.get("feed_url"),
                records_fetched=0,
                created_at=now,
                updated_at=now,
            ),
        )
    return rows


class FakeQuery:
    def __init__(self, model, store):
        self.model = model
        self.store = store
        self._filters = []
        self._order_key = None
        self._limit = None
        self._is_column_query = not hasattr(model, "__name__")

    def filter(self, *args, **_kwargs):
        for arg in args:
            left = getattr(arg, "left", None)
            right = getattr(arg, "right", None)
            if left is not None and hasattr(left, "key"):
                if right is not None and hasattr(right, "value"):
                    self._filters.append((left.key, right.value, "eq"))
                elif right is True or getattr(right, "value", None) is True:
                    self._filters.append((left.key, True, "is_true"))
        return self

    def order_by(self, column):
        self._order_key = getattr(column, "key", None) or getattr(column, "name", None)
        return self

    def limit(self, value):
        self._limit = value
        return self

    def all(self):
        if self._is_column_query:
            key = getattr(self.model, "key", None) or getattr(self.model, "name", None)
            if key == "source_id":
                return [(row.source_id,) for row in self.store["sources"]]
            return []

        model_name = getattr(self.model, "__name__", "")
        if model_name == "SavedOpportunity":
            return []
        if model_name == "OpportunitySource":
            rows = list(self.store["sources"])
        else:
            rows = list(self.store["opportunities"].values())

        for key, value, op in self._filters:
            if op == "is_true" and key == "enabled":
                rows = [row for row in rows if getattr(row, "enabled", False) is True]
            else:
                rows = [row for row in rows if getattr(row, key, None) == value]

        if self._order_key and rows and hasattr(rows[0], self._order_key):
            rows.sort(key=lambda row: getattr(row, self._order_key))
        if self._limit is not None:
            rows = rows[: self._limit]
        return rows

    def first(self):
        rows = self.all()
        return rows[0] if rows else None


class FakeDB:
    def __init__(self, existing=None, sources=None):
        self.store = {
            "opportunities": {},
            "sources": sources if sources is not None else _seed_sources(),
        }
        if existing:
            self.store["opportunities"][existing.id] = existing
        self.added = []

    def query(self, model):
        return FakeQuery(model, self.store)

    def add(self, obj):
        self.added.append(obj)
        if isinstance(obj, OpportunitySource):
            for index, row in enumerate(self.store["sources"]):
                if row.source_id == obj.source_id:
                    self.store["sources"][index] = obj
                    return
            self.store["sources"].append(obj)
            return
        if hasattr(obj, "id") and not getattr(obj, "id", None):
            obj.id = f"opp-{len(self.added)}"
        if hasattr(obj, "title"):
            now = datetime.now(timezone.utc)
            if getattr(obj, "created_at", None) is None:
                obj.created_at = now
            if getattr(obj, "updated_at", None) is None:
                obj.updated_at = now
            self.store["opportunities"][obj.id] = obj

    def commit(self):
        pass

    def refresh(self, obj):
        if isinstance(obj, OpportunitySource):
            for index, row in enumerate(self.store["sources"]):
                if row.source_id == obj.source_id:
                    self.store["sources"][index] = obj
                    break


def test_seed_sources_in_session():
    db = FakeDB(sources=[])
    created = seed_sources_in_session(db)
    assert created is True
    assert len(db.store["sources"]) == 7


def test_list_sources_returns_registry_fields():
    service = SourceService(FakeDB())
    result = service.list_sources()
    assert result.total == 7
    assert result.enabled_count == 7
    first = result.sources[0]
    assert first.source_id
    assert first.source_name
    assert first.enabled is True
    assert first.health_status == HealthStatus.UNKNOWN


def test_connector_contract_fetch_normalize_health():
    async def _run():
        connector = CareerPageConnector(
            source_id="google_careers",
            source_name="Google Careers",
            source_type=SourceType.MANUAL,
            feed_url="https://careers.google.com",
            company_slug="google",
        )
        raw = await connector.fetch_opportunities()
        assert len(raw) >= 1
        normalized = connector.normalize(raw[0])
        assert normalized.title
        assert normalized.apply_link
        health = await connector.health_check()
        assert health.status == HealthStatus.HEALTHY

        startup = StartupJobsConnector(
            source_id="wellfound",
            source_name="Wellfound",
            source_type=SourceType.WELLFOUND,
            feed_url="https://wellfound.com",
            board_slug="wellfound",
        )
        community = CommunityConnector(
            source_id="student_tribe",
            source_name="Student Tribe",
            source_type=SourceType.STUDENT_TRIBE,
            feed_url="https://studenttribe.com",
            community_slug="student-tribe",
        )
        assert len(await startup.fetch_opportunities()) >= 1
        assert len(await community.fetch_opportunities()) >= 1

    asyncio.run(_run())


def test_sync_source_ingests_via_pipeline():
    service = SourceService(FakeDB())
    result = asyncio.run(service.sync_source("google_careers", "user-1"))
    assert result.status == "success"
    assert result.found == 2
    assert result.ingested == 2
    assert result.duplicates == 0
    assert result.records_fetched == 2
    assert result.last_sync is not None
    assert result.health_status == HealthStatus.HEALTHY


def test_sync_source_deduplicates():
    existing = _make_opportunity()
    service = SourceService(FakeDB(existing))
    result = asyncio.run(service.sync_source("google_careers", "user-1"))
    assert result.found == 2
    assert result.ingested == 1
    assert result.duplicates == 1


def test_sync_disabled_source_blocked():
    db = FakeDB()
    db.store["sources"][0].enabled = False
    service = SourceService(db)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(service.sync_source(db.store["sources"][0].source_id, "user-1"))
    assert exc.value.status_code == 409


def test_check_health_updates_registry():
    service = SourceService(FakeDB())
    result = asyncio.run(service.check_health())
    assert len(result.items) == 7
    assert result.healthy_count == 7
    listed = service.list_sources()
    assert all(row.health_status == HealthStatus.HEALTHY for row in listed.sources)


def test_sync_all_enabled():
    service = SourceService(FakeDB())
    results = asyncio.run(service.sync_all_enabled("user-1"))
    assert len(results) == 7
    assert sum(row.found for row in results) == 14


def test_get_enabled_connectors():
    service = SourceService(FakeDB())
    connectors = service.get_enabled_connectors()
    assert len(connectors) == 7
    assert "google_careers" in connectors
    assert connectors["wellfound"].source_name == "Wellfound"


def test_sync_unknown_source_404():
    service = SourceService(FakeDB())
    with pytest.raises(HTTPException) as exc:
        asyncio.run(service.sync_source("unknown_source", "user-1"))
    assert exc.value.status_code == 404


def test_registry_has_future_ready_sources():
    ids = {seed["source_id"] for seed in SOURCE_SEEDS}
    assert ids == {
        "google_careers",
        "microsoft_careers",
        "amazon_jobs",
        "ycombinator_jobs",
        "wellfound",
        "student_tribe",
        "thub",
    }
    kinds = {seed["connector_kind"] for seed in SOURCE_SEEDS}
    assert kinds == {
        ConnectorKind.CAREER_PAGE.value,
        ConnectorKind.STARTUP_JOBS.value,
        ConnectorKind.COMMUNITY.value,
    }
