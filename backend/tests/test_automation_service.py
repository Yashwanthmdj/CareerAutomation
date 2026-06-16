from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.automation_models import AgentStatus, AgentType, AutomationAgent, AutomationExecution, ExecutionStatus
from app.automation_schemas import AutomationAgentUpdate, RecordExecutionRequest
from app.automation_service import AGENT_SEEDS, AutomationService, seed_agents_in_session


def _make_agent(**kwargs) -> AutomationAgent:
    now = datetime.now(timezone.utc)
    defaults = {
        "id": "agent-1",
        "name": "Apply Agent",
        "agent_type": AgentType.APPLY_AGENT.value,
        "description": "Submits tailored applications across job portals.",
        "enabled": False,
        "status": AgentStatus.NOT_CONFIGURED.value,
        "success_rate": 0.0,
        "last_run_at": None,
        "total_runs": 0,
        "successful_runs": 0,
        "failed_runs": 0,
        "configuration_json": {"mode": "manual_approval"},
        "created_at": now,
        "updated_at": now,
    }
    defaults.update(kwargs)
    return AutomationAgent(**defaults)


class FakeQuery:
    def __init__(self, model, store):
        self.model = model
        self.store = store
        self._filters = []
        self._order = None
        self._limit = None
        self._is_column_query = not hasattr(model, "__name__")

    def filter(self, *args, **_kwargs):
        for arg in args:
            left = getattr(arg, "left", None)
            right = getattr(arg, "right", None)
            if left is not None and hasattr(left, "key") and right is not None:
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
            key = getattr(self.model, "key", None) or getattr(self.model, "name", None)
            if key == "agent_type":
                return [(agent.agent_type,) for agent in self.store["agents"]]
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


class FakeDB:
    def __init__(self, agents=None, executions=None):
        self.store = {
            "agents": agents or [],
            "executions": executions or [],
        }
        self.committed = False

    def query(self, model):
        return FakeQuery(model, self.store)

    def add(self, obj):
        if isinstance(obj, AutomationAgent):
            if not getattr(obj, "id", None):
                obj.id = f"agent-{len(self.store['agents']) + 1}"
            now = datetime.now(timezone.utc)
            if obj.created_at is None:
                obj.created_at = now
            if obj.updated_at is None:
                obj.updated_at = now
            self.store["agents"].append(obj)
        if isinstance(obj, AutomationExecution):
            if not getattr(obj, "id", None):
                obj.id = f"exec-{len(self.store['executions']) + 1}"
            self.store["executions"].append(obj)

    def commit(self):
        self.committed = True

    def refresh(self, _obj):
        pass


def test_seed_creates_all_agents_once():
    db = FakeDB()
    assert seed_agents_in_session(db) is True
    assert len(db.store["agents"]) == len(AGENT_SEEDS)
    assert seed_agents_in_session(db) is False
    assert len(db.store["agents"]) == len(AGENT_SEEDS)


def test_get_agents_returns_seeded_order():
    agents = [
        _make_agent(id="a4", agent_type=AgentType.OPPORTUNITY_SCOUT.value, name="Opportunity Scout"),
        _make_agent(id="a1", agent_type=AgentType.APPLY_AGENT.value, name="Apply Agent"),
    ]
    service = AutomationService(FakeDB(agents))
    result = service.get_agents()
    assert result[0].agent_type == AgentType.APPLY_AGENT
    assert result[1].agent_type == AgentType.OPPORTUNITY_SCOUT


def test_enable_agent_sets_ready():
    agent = _make_agent()
    service = AutomationService(FakeDB([agent]))
    updated = service.enable_agent(agent.id)
    assert updated.enabled is True
    assert updated.status == AgentStatus.READY


def test_disable_agent_sets_paused():
    agent = _make_agent(enabled=True, status=AgentStatus.READY.value)
    service = AutomationService(FakeDB([agent]))
    updated = service.disable_agent(agent.id)
    assert updated.enabled is False
    assert updated.status == AgentStatus.PAUSED


def test_update_agent_configuration():
    agent = _make_agent()
    service = AutomationService(FakeDB([agent]))
    updated = service.update_agent(
        agent.id,
        AutomationAgentUpdate(configuration_json={"mode": "auto", "daily_limit": 5}),
    )
    assert updated.configuration_json["mode"] == "auto"


def test_update_agent_status_rejects_running_when_disabled():
    agent = _make_agent(enabled=False)
    service = AutomationService(FakeDB([agent]))
    with pytest.raises(HTTPException) as exc:
        service.update_agent(agent.id, AutomationAgentUpdate(status=AgentStatus.RUNNING))
    assert exc.value.status_code == 400


def test_record_execution_success_updates_metrics():
    agent = _make_agent(enabled=True, status=AgentStatus.READY.value)
    service = AutomationService(FakeDB([agent]))
    updated = service.record_execution(
        agent.id,
        RecordExecutionRequest(status=ExecutionStatus.SUCCESS, duration_ms=1200, details_json={"ok": True}),
    )
    assert updated.total_runs == 1
    assert updated.successful_runs == 1
    assert updated.success_rate == 100.0
    assert updated.last_run_at is not None
    assert len(service.db.store["executions"]) == 1


def test_record_execution_failure_sets_error_status():
    agent = _make_agent(enabled=True, status=AgentStatus.READY.value)
    service = AutomationService(FakeDB([agent]))
    updated = service.record_execution(
        agent.id,
        RecordExecutionRequest(status=ExecutionStatus.FAILED, duration_ms=800),
    )
    assert updated.failed_runs == 1
    assert updated.status == AgentStatus.ERROR


def test_record_execution_success_rate_calculation():
    agent = _make_agent(
        enabled=True,
        status=AgentStatus.READY.value,
        total_runs=1,
        successful_runs=1,
        success_rate=100.0,
    )
    service = AutomationService(FakeDB([agent]))
    updated = service.record_execution(
        agent.id,
        RecordExecutionRequest(status=ExecutionStatus.FAILED, duration_ms=500),
    )
    assert updated.total_runs == 2
    assert updated.success_rate == 50.0


def test_get_registry_metrics():
    agents = [
        _make_agent(id="a1", enabled=True, status=AgentStatus.READY.value),
        _make_agent(id="a2", agent_type=AgentType.EMAIL_AGENT.value, name="Email Agent", enabled=True, status=AgentStatus.READY.value),
        _make_agent(id="a3", agent_type=AgentType.FORM_AGENT.value, name="Form Agent", enabled=False, status=AgentStatus.NOT_CONFIGURED.value),
        _make_agent(id="a4", agent_type=AgentType.OPPORTUNITY_SCOUT.value, name="Opportunity Scout", enabled=False, status=AgentStatus.PAUSED.value),
    ]
    metrics = AutomationService(FakeDB(agents)).get_registry_metrics()
    assert metrics.total_agents == 4
    assert metrics.enabled_agents == 2
    assert metrics.ready_agents == 2
    assert metrics.registry_health == 100.0


def test_get_agent_includes_recent_executions():
    agent = _make_agent()
    now = datetime.now(timezone.utc)
    executions = [
        AutomationExecution(
            id="exec-1",
            agent_id=agent.id,
            status=ExecutionStatus.SUCCESS.value,
            started_at=now,
            completed_at=now,
            duration_ms=100,
            details_json={},
        )
    ]
    service = AutomationService(FakeDB([agent], executions))
    result = service.get_agent(agent.id)
    assert len(result.recent_executions) == 1
