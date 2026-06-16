from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .automation_schemas import (
    AutomationAgentActionResponse,
    AutomationAgentListOut,
    AutomationAgentOut,
    AutomationAgentUpdate,
    AutomationRegistryMetrics,
    RecordExecutionRequest,
)
from .automation_service import AutomationService
from .database import get_db
from .deps import get_current_user
from .models import User

router = APIRouter(prefix="/automations", tags=["automations"])


def _service(db: Session) -> AutomationService:
    return AutomationService(db)


@router.get("/metrics/registry", response_model=AutomationRegistryMetrics)
def get_registry_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).get_registry_metrics()


@router.get("", response_model=AutomationAgentListOut)
def list_automation_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agents = _service(db).get_agents()
    return AutomationAgentListOut(agents=agents, total=len(agents))


@router.get("/{agent_id}", response_model=AutomationAgentOut)
def get_automation_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).get_agent(agent_id)


@router.patch("/{agent_id}", response_model=AutomationAgentOut)
def update_automation_agent(
    agent_id: str,
    payload: AutomationAgentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).update_agent(agent_id, payload)


@router.post("/{agent_id}/enable", response_model=AutomationAgentActionResponse)
def enable_automation_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent = _service(db).enable_agent(agent_id)
    return AutomationAgentActionResponse(message="Agent enabled", agent=agent)


@router.post("/{agent_id}/disable", response_model=AutomationAgentActionResponse)
def disable_automation_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent = _service(db).disable_agent(agent_id)
    return AutomationAgentActionResponse(message="Agent disabled", agent=agent)


@router.post("/{agent_id}/executions", response_model=AutomationAgentOut)
def record_agent_execution(
    agent_id: str,
    payload: RecordExecutionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record execution history (foundation for future automation runs)."""
    return _service(db).record_execution(agent_id, payload)
