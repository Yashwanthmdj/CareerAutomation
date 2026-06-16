from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from .opportunity_schemas import OpportunityOut


class OpportunityMatchOut(BaseModel):
    opportunity_id: str
    match_score: int = Field(ge=0, le=100)
    match_level: str
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    analysis_ready: bool = True
    message: Optional[str] = None


class OpportunityRecommendationOut(BaseModel):
    opportunity: OpportunityOut
    match_score: int = Field(ge=0, le=100)
    match_level: str
    matched_skills: List[str] = []
    missing_skills: List[str] = []


class OpportunityRecommendationListOut(BaseModel):
    recommendations: List[OpportunityRecommendationOut]
    total: int
    analysis_ready: bool = True
    resume_id: Optional[str] = None
    message: Optional[str] = None
