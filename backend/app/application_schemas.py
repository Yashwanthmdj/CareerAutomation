from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .application_models import ApplicationStatus
from .opportunity_schemas import OpportunityOut


class ApplicationCreate(BaseModel):
    opportunity_id: str = Field(min_length=1)
    notes: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    opportunity_id: str
    status: ApplicationStatus
    notes: Optional[str] = None
    applied_at: Optional[datetime] = None
    assessment_at: Optional[datetime] = None
    interview_at: Optional[datetime] = None
    offer_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    opportunity: OpportunityOut
    match_score: Optional[int] = None
    match_level: Optional[str] = None


class ApplicationListOut(BaseModel):
    applications: List[ApplicationOut]
    total: int


class ApplicationFunnelStage(BaseModel):
    stage: ApplicationStatus
    label: str
    count: int


class ApplicationDashboardMetrics(BaseModel):
    active_applications: int = 0
    interviews: int = 0
    offers: int = 0
    rejected: int = 0
    success_rate: float = 0.0
    interview_rate: float = 0.0
    offer_rate: float = 0.0
    applications_count: int = 0
    funnel: List[ApplicationFunnelStage] = []


class ApplicationDeleteResponse(BaseModel):
    message: str = "Application deleted"
