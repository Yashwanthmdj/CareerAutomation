from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class AgentType(str, enum.Enum):
    APPLY_AGENT = "APPLY_AGENT"
    EMAIL_AGENT = "EMAIL_AGENT"
    FORM_AGENT = "FORM_AGENT"
    OPPORTUNITY_SCOUT = "OPPORTUNITY_SCOUT"


class AgentStatus(str, enum.Enum):
    NOT_CONFIGURED = "NOT_CONFIGURED"
    READY = "READY"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    ERROR = "ERROR"


class ExecutionStatus(str, enum.Enum):
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class AutomationAgent(Base):
    __tablename__ = "automation_agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    agent_type: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=AgentStatus.NOT_CONFIGURED.value,
        index=True,
    )
    success_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_runs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    successful_runs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_runs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    configuration_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    executions: Mapped[List["AutomationExecution"]] = relationship(
        back_populates="agent",
        cascade="all, delete-orphan",
    )


class AutomationExecution(Base):
    __tablename__ = "automation_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("automation_agents.id", ondelete="CASCADE"),
        index=True,
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=ExecutionStatus.RUNNING.value)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    details_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    agent: Mapped["AutomationAgent"] = relationship(back_populates="executions")
