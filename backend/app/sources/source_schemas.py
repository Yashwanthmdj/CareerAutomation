from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .source_models import ConnectorKind, HealthStatus


class OpportunitySourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    source_id: str
    source_name: str
    connector_kind: ConnectorKind
    source_type: str
    enabled: bool
    health_status: HealthStatus
    last_sync: Optional[datetime] = None
    records_fetched: int = 0
    feed_url: Optional[str] = None


class OpportunitySourceListOut(BaseModel):
    sources: List[OpportunitySourceOut] = []
    total: int = 0
    enabled_count: int = 0


class SourceHealthItemOut(BaseModel):
    source_id: str
    source_name: str
    health_status: HealthStatus
    message: str
    latency_ms: Optional[int] = None
    last_sync: Optional[datetime] = None
    records_fetched: int = 0
    enabled: bool = True


class SourceHealthOut(BaseModel):
    items: List[SourceHealthItemOut] = []
    healthy_count: int = 0
    degraded_count: int = 0
    unhealthy_count: int = 0
    unknown_count: int = 0


class SourceSyncResponse(BaseModel):
    source_id: str
    source_name: str
    status: str
    found: int = 0
    ingested: int = 0
    duplicates: int = 0
    records_fetched: int = 0
    health_status: HealthStatus
    last_sync: Optional[datetime] = None
    duration_ms: Optional[int] = None
    message: Optional[str] = None
