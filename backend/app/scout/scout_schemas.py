from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ScoutSourceBreakdownOut(BaseModel):
    source_name: str
    found: int = 0
    ingested: int = 0
    duplicates: int = 0


class ScoutMetricsOut(BaseModel):
    scanned_sources: int = 0
    opportunities_found: int = 0
    opportunities_ingested: int = 0
    duplicates_removed: int = 0
    last_scan_at: Optional[datetime] = None
    new_today: int = 0
    ingested_today: int = 0


class ScoutRunResponse(BaseModel):
    status: str
    sources: List[str] = []
    found: int = 0
    ingested: int = 0
    duplicates: int = 0
    source_breakdown: List[ScoutSourceBreakdownOut] = []
    message: Optional[str] = None
    duration_ms: Optional[int] = None


class ScoutStatusOut(BaseModel):
    status: str
    connected_sources: List[str] = []
    last_run_at: Optional[datetime] = None
    last_run_status: Optional[str] = None
    opportunities_found: int = 0
    opportunities_ingested: int = 0
    duplicates: int = 0
    is_running: bool = False
    source_breakdown: List[ScoutSourceBreakdownOut] = []
    metrics: ScoutMetricsOut = Field(default_factory=ScoutMetricsOut)


class ScoutHistoryItemOut(BaseModel):
    id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    sources_scanned: List[str] = []
    opportunities_found: int = 0
    opportunities_ingested: int = 0
    duplicates_removed: int = 0
    trigger: Optional[str] = None
    details_json: Dict[str, Any] = Field(default_factory=dict)


class ScoutHistoryOut(BaseModel):
    items: List[ScoutHistoryItemOut] = []
    total: int = 0
