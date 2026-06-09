from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..ai.factory import get_ai_provider
from ..ai.providers.base import AIProvider, AIResumeOptimizationResult
from ..ai.schemas import OptimizationRequest, OptimizationResponse
from ..analysis_models import ResumeAnalysis
from ..models import User
from ..resume_models import Resume
from ..resume_service import get_user_resume


def _resolve_target_role(request: OptimizationRequest, resume: Resume) -> str:
    if request.target_role and request.target_role.strip():
        return request.target_role.strip()
    if resume.title and resume.title.strip():
        return resume.title.strip()
    return "Software Engineer"


def _load_resume_text(db: Session, resume_id: str) -> str:
    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume_id).first()
    if not analysis or not analysis.raw_text or not analysis.raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text is not available. Upload and parse the resume before optimizing.",
        )
    if analysis.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume parsing is not complete. Run analysis before optimizing.",
        )
    return analysis.raw_text


def _to_response(result: AIResumeOptimizationResult) -> OptimizationResponse:
    return OptimizationResponse(
        summary=result.summary,
        missing_skills=result.missing_skills,
        improvements=result.improvements,
        ats_gain=result.ats_gain,
        target_role=result.target_role,
        provider=result.provider,
    )


def optimize_resume_with_ai(
    db: Session,
    user: User,
    resume_id: str,
    request: OptimizationRequest,
    provider: Optional[AIProvider] = None,
) -> OptimizationResponse:
    """Load resume text and run AI optimization via the configured provider."""
    resume = get_user_resume(db, user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    resume_text = _load_resume_text(db, resume_id)
    target_role = _resolve_target_role(request, resume)
    ai_provider = provider or get_ai_provider("mock")

    result = ai_provider.optimize_resume(resume_text=resume_text, target_role=target_role)
    return _to_response(result)
