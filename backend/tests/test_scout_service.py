from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.automation_models import AgentStatus, AgentType, AutomationAgent, AutomationExecution
from app.opportunity_models import Opportunity, OpportunityType, SourceType
from app.scout.scout_models import CONNECTOR_SOURCES, reset_scout_state_for_tests
from app.scout.scout_scheduler import ScoutScheduler
from app.scout.scout_service import ScoutService
from app.sources.source_models import HealthStatus, OpportunitySource
from app.sources.source_registry import SOURCE_SEEDS
from tests.test_source_service import FakeDB as SourceFakeDB


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


def _make_scout_agent(**kwargs) -> AutomationAgent:
    now = datetime.now(timezone.utc)
    defaults = {
        "id": "scout-agent-1",
        "name": "Opportunity Scout",
        "agent_type": AgentType.OPPORTUNITY_SCOUT.value,
        "description": "Monitors connected channels for high-fit roles.",
        "enabled": True,
        "status": AgentStatus.READY.value,
        "success_rate": 0.0,
        "last_run_at": None,
        "total_runs": 0,
        "successful_runs": 0,
        "failed_runs": 0,
        "configuration_json": {"sources": CONNECTOR_SOURCES},
        "created_at": now,
        "updated_at": now,
    }
    defaults.update(kwargs)
    return AutomationAgent(**defaults)


def _seed_sources() -> list[OpportunitySource]:
    now = datetime.now(timezone.utc)
    return [
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
        )
        for seed in SOURCE_SEEDS
    ]


class _AutomationQuery:
    def __init__(self, model, store):
        self.model = model
        self.store = store
        self._filters = []
        self._order = False
        self._limit = None
        self._is_column_query = not hasattr(model, "__name__")

    def filter(self, *args, **_kwargs):
        for arg in args:
            left = getattr(arg, "left", None)
            right = getattr(arg, "right", None)
            if left is not None and hasattr(left, "key") and right is not None and hasattr(right, "value"):
                self._filters.append((left.key, right.value))
        return self

    def order_by(self, *_args):
        self._order = True
        return self

    def limit(self, value):
        self._limit = value
        return self

    def all(self):
        if self._is_column_query:
            return []
        model_name = getattr(self.model, "__name__", "")
        if model_name == "AutomationAgent":
            rows = list(self.store["agents"])
        elif model_name == "AutomationExecution":
            rows = list(self.store["executions"])
        else:
            rows = []
        for key, value in self._filters:
            rows = [row for row in rows if getattr(row, key, None) == value]
        if self._order and model_name == "AutomationExecution":
            rows.sort(key=lambda row: row.started_at, reverse=True)
        if self._limit is not None:
            rows = rows[: self._limit]
        return rows

    def first(self):
        rows = self.all()
        return rows[0] if rows else None


class ScoutFakeDB(SourceFakeDB):
    def __init__(self, existing=None, scout_agent=None):
        super().__init__(existing=existing, sources=_seed_sources())
        self.store["agents"] = [scout_agent] if scout_agent else [_make_scout_agent()]
        self.store["executions"] = []

    def query(self, model):
        model_name = getattr(model, "__name__", "")
        if model_name in {"AutomationAgent", "AutomationExecution"}:
            return _AutomationQuery(model, self.store)
        return super().query(model)

    def add(self, obj):
        if isinstance(obj, AutomationExecution):
            if not getattr(obj, "id", None):
                obj.id = f"exec-{len(self.store['executions']) + 1}"
            self.store["executions"].append(obj)
            return
        if isinstance(obj, AutomationAgent):
            for index, agent in enumerate(self.store["agents"]):
                if agent.id == obj.id:
                    self.store["agents"][index] = obj
                    return
            self.store["agents"].append(obj)
            return
        super().add(obj)


@pytest.fixture(autouse=True)
def reset_state():
    reset_scout_state_for_tests()
    yield
    reset_scout_state_for_tests()


def test_registered_sources():
    service = ScoutService(ScoutFakeDB())
    sources = service.list_registered_sources()
    assert set(sources) == set(CONNECTOR_SOURCES)


def test_run_all_connectors_ingests_from_source_framework():
    service = ScoutService(ScoutFakeDB())

    result = asyncio.run(service.run_all_connectors("user-1", skip_agent_gate=True))

    assert result.status == "success"
    assert result.found == 14
    assert result.ingested == 14
    assert result.duplicates == 0
    assert set(result.sources) == set(CONNECTOR_SOURCES)
    assert len(result.source_breakdown) == 7


def test_run_connector_only_runs_one_source():
    service = ScoutService(ScoutFakeDB())

    result = asyncio.run(service.run_connector("google_careers", "user-1", skip_agent_gate=True))

    assert result.status == "success"
    assert result.sources == ["Google Careers"]
    assert result.found == 2
    assert result.ingested == 2


def test_run_connector_counts_duplicates_via_ingestion_pipeline():
    existing = _make_opportunity()
    service = ScoutService(ScoutFakeDB(existing))

    result = asyncio.run(service.run_connector("Google Careers", "user-1", skip_agent_gate=True))

    assert result.found == 2
    assert result.ingested == 1
    assert result.duplicates == 1


def test_scout_agent_gate_blocks_disabled_agent():
    disabled_agent = _make_scout_agent(enabled=False, status=AgentStatus.PAUSED.value)
    service = ScoutService(ScoutFakeDB(scout_agent=disabled_agent))

    with pytest.raises(HTTPException) as exc:
        asyncio.run(service.run_all_connectors("user-1"))

    assert exc.value.status_code == 403


def test_scout_agent_gate_blocks_not_ready_agent():
    not_ready = _make_scout_agent(status=AgentStatus.RUNNING.value)
    service = ScoutService(ScoutFakeDB(scout_agent=not_ready))

    with pytest.raises(HTTPException) as exc:
        asyncio.run(service.run_connector("wellfound", "user-1"))

    assert exc.value.status_code == 409


def test_collect_metrics_reflects_last_run():
    service = ScoutService(ScoutFakeDB())
    asyncio.run(service.run_all_connectors("user-1", skip_agent_gate=True))

    metrics = service.collect_metrics()
    assert metrics.scanned_sources == 7
    assert metrics.opportunities_found == 14
    assert metrics.opportunities_ingested == 14
    assert metrics.last_scan_at is not None


def test_get_status_includes_metrics():
    service = ScoutService(ScoutFakeDB())
    asyncio.run(service.run_all_connectors("user-1", skip_agent_gate=True))

    status = service.get_status()
    assert set(status.connected_sources) == set(CONNECTOR_SOURCES)
    assert status.metrics.scanned_sources == 7
    assert status.is_running is False


def test_execution_history_recorded_on_successful_run():
    service = ScoutService(ScoutFakeDB())

    asyncio.run(service.run_all_connectors("user-1"))

    history = service.get_history()
    assert history.total == 1
    item = history.items[0]
    assert item.opportunities_found == 14
    assert item.opportunities_ingested == 14
    assert len(item.sources_scanned) == 7


def test_scheduler_skips_when_agent_disabled():
    disabled_agent = _make_scout_agent(enabled=False, status=AgentStatus.PAUSED.value)
    db = ScoutFakeDB(scout_agent=disabled_agent)

    class EngineStub:
        pass

    class SessionCtx:
        def __init__(self, session_db):
            self.session_db = session_db

        def __enter__(self):
            return self.session_db

        def __exit__(self, *_args):
            return False

    import app.scout.scout_scheduler as scheduler_module

    original_session = scheduler_module.Session
    scheduler_module.Session = lambda _engine: SessionCtx(db)
    try:
        scheduler = ScoutScheduler()
        ran = asyncio.run(scheduler.run_scheduled_scan(EngineStub()))
    finally:
        scheduler_module.Session = original_session

    assert ran is False


def test_scheduler_interval_defaults_to_fifteen_minutes():
    scheduler = ScoutScheduler()
    assert scheduler.interval_seconds == 15 * 60


def test_ingest_results_isolated():
    service = ScoutService(ScoutFakeDB())
    from app.opportunity_schemas import OpportunityCreate

    payloads = [
        OpportunityCreate(
            title="Test Role",
            company="Test Co",
            source_type=SourceType.MANUAL,
            source_name="Google Careers",
            apply_link="https://careers.google.com/jobs/test-only-role",
            opportunity_type=OpportunityType.JOB,
        ),
    ]
    breakdown = service.ingest_results(payloads, "Google Careers", "user-1")
    assert breakdown.found == 1
    assert breakdown.ingested == 1
