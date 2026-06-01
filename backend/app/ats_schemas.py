from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class SkillNormalizationItem(BaseModel):
    raw: str
    normalized: str


class FamilyMatchItem(BaseModel):
    target_skill: str
    resume_skill: str
    family: str


class ScoreBreakdownItem(BaseModel):
    category: str
    label: str
    score: int = Field(ge=0, le=100)
    weight: int = Field(ge=0, le=100, description="Weight toward overall ATS score (sum = 100)")
    detail: str = ""


class AtsIntelligenceOut(BaseModel):
    ats_score: int = Field(ge=0, le=100)
    grade: str = ""
    score_breakdown: List[ScoreBreakdownItem] = []
    missing_skills: List[str] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []
    target_role: str = ""
    detected_role: str = ""
    role_detection_source: str = ""
    matched_skills: List[str] = []
    direct_matches: List[str] = []
    family_matches: List[FamilyMatchItem] = []
    target_skill_set: List[str] = []
    resume_skills_normalized: List[SkillNormalizationItem] = []
    target_skills_normalized: List[SkillNormalizationItem] = []
    resume_skill_count: int = 0
    target_skill_count: int = 0
    analysis_ready: bool = False
