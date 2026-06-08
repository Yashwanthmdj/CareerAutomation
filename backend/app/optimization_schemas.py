from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel, Field


class SectionScoresOut(BaseModel):
    summary: int = Field(ge=0, le=100, default=0)
    skills: int = Field(ge=0, le=100, default=0)
    projects: int = Field(ge=0, le=100, default=0)
    experience: int = Field(ge=0, le=100, default=0)
    education: int = Field(ge=0, le=100, default=0)


class AtsSimulatorActionOut(BaseModel):
    title: str
    estimated_gain: int = Field(ge=0, le=25)


class AtsSimulatorOut(BaseModel):
    current_score: int = Field(ge=0, le=100, default=0)
    projected_score: int = Field(ge=0, le=100, default=0)
    actions: List[AtsSimulatorActionOut] = []


class ResumeOptimizationOut(BaseModel):
    health_score: int = Field(ge=0, le=100, default=0)
    ats_readiness: int = Field(ge=0, le=100, default=0)
    keyword_coverage: int = Field(ge=0, le=100, default=0)
    recruiter_readability: int = Field(ge=0, le=100, default=0)
    section_scores: SectionScoresOut = Field(default_factory=SectionScoresOut)
    strengths: List[str] = []
    improvements: List[str] = []
    ats_simulator: AtsSimulatorOut = Field(default_factory=AtsSimulatorOut)
