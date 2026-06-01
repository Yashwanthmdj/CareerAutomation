from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class AnalysisSummaryOut(BaseModel):
    skills_count: int = 0
    projects_count: int = 0
    education_count: int = 0
    experience_count: int = 0
    certifications_count: int = 0


class ExtractedSkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    skill: str


class ExtractedEducationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    college: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[str] = None
    cgpa: Optional[str] = None


class ExtractedProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_name: str
    description: Optional[str] = None
    technologies: Optional[str] = None


class ExtractedExperienceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None


class ExtractedCertificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    certification_name: str


class ResumeAnalysisOut(BaseModel):
    status: str = "pending"
    skills: List[ExtractedSkillOut] = []
    education: List[ExtractedEducationOut] = []
    projects: List[ExtractedProjectOut] = []
    experience: List[ExtractedExperienceOut] = []
    certifications: List[ExtractedCertificationOut] = []
    raw_text: Optional[str] = None
    summary: AnalysisSummaryOut
    analyzed_at: Optional[datetime] = None
    error_message: Optional[str] = None
