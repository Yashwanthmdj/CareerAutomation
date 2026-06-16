from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class ConnectorKind(str, enum.Enum):
    CAREER_PAGE = "CAREER_PAGE"
    STARTUP_JOBS = "STARTUP_JOBS"
    COMMUNITY = "COMMUNITY"


class HealthStatus(str, enum.Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNHEALTHY = "UNHEALTHY"
    UNKNOWN = "UNKNOWN"


class OpportunitySource(Base):
    """Registry entry for a pluggable opportunity source."""

    __tablename__ = "opportunity_sources"

    source_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_name: Mapped[str] = mapped_column(String(120), nullable=False)
    connector_kind: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    health_status: Mapped[str] = mapped_column(String(16), nullable=False, default=HealthStatus.UNKNOWN.value)
    last_sync: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    records_fetched: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    feed_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
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
