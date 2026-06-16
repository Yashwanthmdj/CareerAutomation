from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from .automation_models import AgentStatus, AgentType, AutomationAgent, AutomationExecution, ExecutionStatus
from .automation_schemas import (
    AutomationAgentOut,
    AutomationAgentUpdate,
    AutomationExecutionOut,
    AutomationRegistryMetrics,
    RecordExecutionRequest,
)

AGENT_SEEDS = [
    {
        "agent_type": AgentType.APPLY_AGENT,
        "name": "Apply Agent",
        "description": "Submits tailored applications across job portals.",
        "configuration_json": {"mode": "manual_approval", "daily_limit": 10},
    },
    {
        "agent_type": AgentType.EMAIL_AGENT,
        "name": "Email Agent",
        "description": "Drafts and sends recruiter follow-ups.",
        "configuration_json": {"tone": "professional", "auto_send": False},
    },
    {
        "agent_type": AgentType.FORM_AGENT,
        "name": "Form Agent",
        "description": "Completes multi-step ATS and application forms.",
        "configuration_json": {"browser_profile": "default", "confirm_before_submit": True},
    },
    {
        "agent_type": AgentType.OPPORTUNITY_SCOUT,
        "name": "Opportunity Scout",
        "description": "Monitors connected channels for high-fit roles.",
        "configuration_json": {"sources": ["Internshala", "Unstop", "Wellfound"], "schedule": "daily"},
    },
]

_AGENT_ORDER = [
    AgentType.APPLY_AGENT.value,
    AgentType.EMAIL_AGENT.value,
    AgentType.FORM_AGENT.value,
    AgentType.OPPORTUNITY_SCOUT.value,
]


def seed_agents_in_session(db: Session) -> bool:
    """Insert default agents when missing. Returns True if any were created."""
    existing_types = {row[0] for row in db.query(AutomationAgent.agent_type).all()}
    created = False
    for seed in AGENT_SEEDS:
        agent_type = seed["agent_type"].value
        if agent_type in existing_types:
            continue
        db.add(
            AutomationAgent(
                name=seed["name"],
                agent_type=agent_type,
                description=seed["description"],
                enabled=False,
                status=AgentStatus.NOT_CONFIGURED.value,
                configuration_json=seed["configuration_json"],
            )
        )
        created = True
    return created


def seed_automation_agents(engine: Engine) -> None:
    """Create default registry agents on startup if missing."""
    with Session(engine) as db:
        if seed_agents_in_session(db):
            db.commit()


class AutomationService:
    def __init__(self, db: Session):
        self.db = db

    def _get_agent_or_404(self, agent_id: str) -> AutomationAgent:
        agent = self.db.query(AutomationAgent).filter(AutomationAgent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation agent not found")
        return agent

    def _recent_executions(self, agent_id: str, limit: int = 8) -> List[AutomationExecution]:
        return (
            self.db.query(AutomationExecution)
            .filter(AutomationExecution.agent_id == agent_id)
            .order_by(desc(AutomationExecution.started_at))
            .limit(limit)
            .all()
        )

    def _to_out(self, agent: AutomationAgent, include_executions: bool = False) -> AutomationAgentOut:
        recent = self._recent_executions(agent.id) if include_executions else []
        return AutomationAgentOut(
            id=agent.id,
            name=agent.name,
            agent_type=AgentType(agent.agent_type),
            description=agent.description,
            enabled=agent.enabled,
            status=AgentStatus(agent.status),
            success_rate=round(float(agent.success_rate or 0), 1),
            last_run_at=agent.last_run_at,
            total_runs=agent.total_runs,
            successful_runs=agent.successful_runs,
            failed_runs=agent.failed_runs,
            configuration_json=agent.configuration_json or {},
            created_at=agent.created_at,
            updated_at=agent.updated_at,
            recent_executions=[
                AutomationExecutionOut(
                    id=row.id,
                    agent_id=row.agent_id,
                    status=ExecutionStatus(row.status),
                    started_at=row.started_at,
                    completed_at=row.completed_at,
                    duration_ms=row.duration_ms,
                    details_json=row.details_json or {},
                )
                for row in recent
            ],
        )

    def get_agents(self) -> List[AutomationAgentOut]:
        rows = self.db.query(AutomationAgent).all()
        rows.sort(key=lambda row: _AGENT_ORDER.index(row.agent_type) if row.agent_type in _AGENT_ORDER else 99)
        return [self._to_out(row) for row in rows]

    def get_agent(self, agent_id: str) -> AutomationAgentOut:
        return self._to_out(self._get_agent_or_404(agent_id), include_executions=True)

    def update_agent(self, agent_id: str, payload: AutomationAgentUpdate) -> AutomationAgentOut:
        agent = self._get_agent_or_404(agent_id)

        if payload.description is not None:
            agent.description = payload.description.strip()
        if payload.configuration_json is not None:
            agent.configuration_json = payload.configuration_json
        if payload.status is not None:
            if payload.status == AgentStatus.RUNNING and not agent.enabled:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot set RUNNING status on a disabled agent.",
                )
            agent.status = payload.status.value

        agent.updated_at = datetime.now(timezone.utc)
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        return self._to_out(agent, include_executions=True)

    def enable_agent(self, agent_id: str) -> AutomationAgentOut:
        agent = self._get_agent_or_404(agent_id)
        agent.enabled = True
        if agent.status in {AgentStatus.NOT_CONFIGURED.value, AgentStatus.PAUSED.value}:
            agent.status = AgentStatus.READY.value
        agent.updated_at = datetime.now(timezone.utc)
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        return self._to_out(agent)

    def disable_agent(self, agent_id: str) -> AutomationAgentOut:
        agent = self._get_agent_or_404(agent_id)
        agent.enabled = False
        if agent.status == AgentStatus.RUNNING.value:
            agent.status = AgentStatus.PAUSED.value
        elif agent.status == AgentStatus.READY.value:
            agent.status = AgentStatus.PAUSED.value
        agent.updated_at = datetime.now(timezone.utc)
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        return self._to_out(agent)

    def record_execution(self, agent_id: str, payload: RecordExecutionRequest) -> AutomationAgentOut:
        agent = self._get_agent_or_404(agent_id)
        now = datetime.now(timezone.utc)

        execution = AutomationExecution(
            agent_id=agent.id,
            status=payload.status.value,
            started_at=now,
            completed_at=now if payload.status != ExecutionStatus.RUNNING else None,
            duration_ms=payload.duration_ms,
            details_json=payload.details_json,
        )
        self.db.add(execution)

        if payload.status != ExecutionStatus.RUNNING:
            agent.total_runs += 1
            agent.last_run_at = now
            if payload.status == ExecutionStatus.SUCCESS:
                agent.successful_runs += 1
            elif payload.status == ExecutionStatus.FAILED:
                agent.failed_runs += 1
                agent.status = AgentStatus.ERROR.value
            if agent.total_runs > 0:
                agent.success_rate = round((agent.successful_runs / agent.total_runs) * 100, 1)
            if payload.status == ExecutionStatus.SUCCESS and agent.enabled:
                agent.status = AgentStatus.READY.value

        agent.updated_at = now
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        return self._to_out(agent, include_executions=True)

    def get_registry_metrics(self) -> AutomationRegistryMetrics:
        agents = self.db.query(AutomationAgent).all()
        total = len(agents)
        enabled = sum(1 for agent in agents if agent.enabled)
        running = sum(1 for agent in agents if agent.status == AgentStatus.RUNNING.value)
        ready = sum(1 for agent in agents if agent.status == AgentStatus.READY.value)

        if enabled > 0:
            ready_enabled = sum(
                1 for agent in agents if agent.enabled and agent.status == AgentStatus.READY.value
            )
            registry_health = round((ready_enabled / enabled) * 100, 1)
        else:
            registry_health = 0.0

        return AutomationRegistryMetrics(
            total_agents=total,
            enabled_agents=enabled,
            running_agents=running,
            ready_agents=ready,
            registry_health=registry_health,
        )
