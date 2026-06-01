from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    file_name: str
    file_size: int
    mime_type: str
    storage_path: str
    supabase_object_key: str
    is_active: bool
    uploaded_at: datetime
    updated_at: datetime


class AnalysisSummaryBrief(BaseModel):
    skills_count: int = 0
    projects_count: int = 0
    education_count: int = 0
    experience_count: int = 0
    certifications_count: int = 0


class ResumeListItemOut(ResumeOut):
    analysis_status: Optional[str] = None
    analysis_summary: Optional[AnalysisSummaryBrief] = None


class ResumeListOut(BaseModel):
    resumes: List[ResumeListItemOut]
    total: int


class ResumeActiveOut(BaseModel):
    resume: Optional[ResumeOut] = None


class ResumeUploadResponse(BaseModel):
    resume: ResumeOut
    message: str = "Resume uploaded successfully"
    analysis_status: str = "pending"


class ResumeActivateResponse(BaseModel):
    resume: ResumeOut
    message: str = "Resume activated successfully"


class ResumeDeleteResponse(BaseModel):
    message: str = "Resume deleted successfully"


class ResumeSummaryOut(BaseModel):
    """Lightweight summary for profile/dashboard."""

    active_resume_title: Optional[str] = None
    active_resume_file_name: Optional[str] = None
    active_resume_uploaded_at: Optional[datetime] = None
    resume_count: int = 0
