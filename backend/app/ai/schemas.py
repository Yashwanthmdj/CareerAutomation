from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class OptimizationRequest(BaseModel):
    """Optional overrides for AI resume optimization."""

    target_role: Optional[str] = Field(
        default=None,
        max_length=120,
        description="Target role for optimization. Uses resume title when omitted.",
    )


class OptimizationResponse(BaseModel):
    """AI-generated resume optimization payload."""

    summary: str
    missing_skills: List[str] = []
    improvements: List[str] = []
    ats_gain: int = Field(ge=0, le=40)
    target_role: str = ""
    provider: str = "mock"
