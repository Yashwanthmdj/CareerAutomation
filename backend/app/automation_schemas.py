from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .automation_models import AgentStatus, AgentType, ExecutionStatus


class AutomationAgentUpdate(BaseModel):
    description: Optional[str] = None
    configuration_json: Optional[Dict[str, Any]] = None
    status: Optional[AgentStatus] = None


class AutomationExecutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_id: str
    status: ExecutionStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    details_json: Dict[str, Any] = Field(default_factory=dict)


class AutomationAgentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    agent_type: AgentType
    description: str
    enabled: bool
    status: AgentStatus
    success_rate: float
    last_run_at: Optional[datetime] = None
    total_runs: int
    successful_runs: int
    failed_runs: int
    configuration_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    recent_executions: List[AutomationExecutionOut] = []


class AutomationAgentListOut(BaseModel):
    agents: List[AutomationAgentOut]
    total: int


class AutomationRegistryMetrics(BaseModel):
    total_agents: int = 0
    enabled_agents: int = 0
    running_agents: int = 0
    ready_agents: int = 0
    registry_health: float = 0.0


class AutomationAgentActionResponse(BaseModel):
    message: str
    agent: AutomationAgentOut


class RecordExecutionRequest(BaseModel):
    status: ExecutionStatus
    duration_ms: Optional[int] = None
    details_json: Dict[str, Any] = Field(default_factory=dict)
