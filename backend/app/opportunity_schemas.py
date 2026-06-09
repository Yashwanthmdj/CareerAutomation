from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .opportunity_models import OpportunityType, SourceType


class OpportunityCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    company: str = Field(min_length=1, max_length=255)
    source_name: Optional[str] = Field(default=None, max_length=120)
    source_type: SourceType = SourceType.MANUAL
    description: Optional[str] = None
    apply_link: Optional[str] = Field(default=None, max_length=1024)
    location: Optional[str] = Field(default=None, max_length=255)
    deadline: Optional[datetime] = None
    required_skills: List[str] = Field(default_factory=list)
    opportunity_type: OpportunityType = OpportunityType.INTERNSHIP


class OpportunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    company: str
    source_name: str
    source_type: SourceType
    description: Optional[str] = None
    apply_link: Optional[str] = None
    location: Optional[str] = None
    deadline: Optional[datetime] = None
    required_skills: List[str] = []
    opportunity_type: OpportunityType
    created_at: datetime
    updated_at: datetime
    is_saved: bool = False


class OpportunityListOut(BaseModel):
    opportunities: List[OpportunityOut]
    total: int


class SavedOpportunityOut(BaseModel):
    id: str
    opportunity: OpportunityOut
    saved_at: datetime


class SavedOpportunityListOut(BaseModel):
    saved: List[SavedOpportunityOut]
    total: int


class OpportunitySaveResponse(BaseModel):
    message: str = "Opportunity saved"
    opportunity_id: str


class OpportunityDeleteResponse(BaseModel):
    message: str = "Opportunity deleted"


class OpportunityIngestRequest(OpportunityCreate):
    """Payload for POST /opportunities/ingest (same shape as create, runs ingestion pipeline)."""


class OpportunityIngestResponse(BaseModel):
    opportunity: OpportunityOut
    is_duplicate: bool = False
    message: str = "Opportunity ingested successfully"


class OpportunitySearchParams(BaseModel):
    q: Optional[str] = None
    source_type: Optional[SourceType] = None
    opportunity_type: Optional[OpportunityType] = None
    saved_only: bool = False
