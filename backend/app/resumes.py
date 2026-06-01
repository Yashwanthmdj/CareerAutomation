from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from .database import get_db
from .deps import get_current_user
from .models import User
from .resume_models import Resume
from .analysis_models import (
    ExtractedCertification,
    ExtractedEducation,
    ExtractedExperience,
    ExtractedProject,
    ExtractedSkill,
    ResumeAnalysis,
)
from .analysis_schemas import (
    AnalysisSummaryOut,
    ExtractedCertificationOut,
    ExtractedEducationOut,
    ExtractedExperienceOut,
    ExtractedProjectOut,
    ExtractedSkillOut,
    ResumeAnalysisOut,
)
from .ats_schemas import AtsIntelligenceOut
from .ats_service import compute_ats_for_resume
from .resume_analysis_service import get_analysis_counts, run_resume_analysis
from .resume_schemas import (
    AnalysisSummaryBrief,
    ResumeActivateResponse,
    ResumeAnalyzeResponse,
    ResumeActiveOut,
    ResumeDeleteResponse,
    ResumeListItemOut,
    ResumeListOut,
    ResumeOut,
    ResumeUploadResponse,
)
from .resume_service import (
    activate_resume,
    default_title,
    get_active_resume,
    get_user_resume,
    user_has_resumes,
    validate_pdf_upload,
)
from .supabase_storage import SupabaseStorage, SupabaseStorageError, build_object_key, build_storage_path

router = APIRouter(prefix="/resumes", tags=["resumes"])
storage = SupabaseStorage()


def _resume_out(resume: Resume) -> ResumeOut:
    return ResumeOut.model_validate(resume)


def _build_analysis_response(db: Session, resume: Resume) -> ResumeAnalysisOut:
    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume.id).first()
    if not analysis:
        counts = {k: 0 for k in get_analysis_counts(db, resume.id)}
        return ResumeAnalysisOut(
            status="pending",
            summary=AnalysisSummaryOut(**counts),
        )

    skills = db.query(ExtractedSkill).filter(ExtractedSkill.resume_id == resume.id).all()
    education = db.query(ExtractedEducation).filter(ExtractedEducation.resume_id == resume.id).all()
    projects = db.query(ExtractedProject).filter(ExtractedProject.resume_id == resume.id).all()
    experience = db.query(ExtractedExperience).filter(ExtractedExperience.resume_id == resume.id).all()
    certifications = (
        db.query(ExtractedCertification).filter(ExtractedCertification.resume_id == resume.id).all()
    )
    counts = get_analysis_counts(db, resume.id)

    return ResumeAnalysisOut(
        status=analysis.status,
        skills=[ExtractedSkillOut.model_validate(s) for s in skills],
        education=[ExtractedEducationOut.model_validate(e) for e in education],
        projects=[ExtractedProjectOut.model_validate(p) for p in projects],
        experience=[ExtractedExperienceOut.model_validate(e) for e in experience],
        certifications=[ExtractedCertificationOut.model_validate(c) for c in certifications],
        raw_text=analysis.raw_text,
        summary=AnalysisSummaryOut(**counts),
        analyzed_at=analysis.created_at,
        error_message=analysis.error_message,
    )


def _list_item_out(db: Session, resume: Resume) -> ResumeListItemOut:
    base = ResumeOut.model_validate(resume)
    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume.id).first()
    summary = None
    status = None
    if analysis:
        status = analysis.status
        counts = get_analysis_counts(db, resume.id)
        summary = AnalysisSummaryBrief(**counts)
    return ResumeListItemOut(
        **base.model_dump(),
        analysis_status=status,
        analysis_summary=summary,
    )


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not storage.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Resume storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        )

    file_name = (file.filename or "resume.pdf").strip()
    content = await file.read()

    try:
        validate_pdf_upload(file_name, file.content_type, content)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    resume_id = str(uuid.uuid4())
    object_key = build_object_key(current_user.id, resume_id)
    storage_path = build_storage_path(current_user.id, resume_id)

    try:
        storage.upload_pdf(object_key, content)
    except SupabaseStorageError as exc:
        message = str(exc)
        if "Invalid Compact JWS" in message:
            message = (
                "Supabase rejected the storage credentials. Use your Secret key (sb_secret_...) "
                "or legacy service_role JWT from Project Settings → API, with no extra quotes "
                "in backend/.env. Restart the backend after updating .env."
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload resume to storage: {message}",
        ) from exc

    resolved_title = (title or "").strip() or default_title(file_name)
    make_active = not user_has_resumes(db, current_user.id)

    resume = Resume(
        id=resume_id,
        user_id=current_user.id,
        title=resolved_title,
        file_name=file_name,
        file_size=len(content),
        mime_type="application/pdf",
        storage_path=storage_path,
        supabase_object_key=object_key,
        is_active=make_active,
    )
    if make_active:
        from .resume_service import deactivate_all_resumes

        deactivate_all_resumes(db, current_user.id, except_id=resume_id)

    db.add(resume)
    db.commit()
    db.refresh(resume)

    analysis_status = run_resume_analysis(db, current_user.id, resume_id, content)

    return ResumeUploadResponse(
        resume=_resume_out(resume),
        analysis_status=analysis_status,
    )


@router.get("", response_model=ResumeListOut)
def list_resumes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )
    return ResumeListOut(resumes=[_list_item_out(db, r) for r in rows], total=len(rows))


@router.get("/active", response_model=ResumeActiveOut)
def get_active(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active = get_active_resume(db, current_user.id)
    return ResumeActiveOut(resume=_resume_out(active) if active else None)


@router.get("/active/ats", response_model=AtsIntelligenceOut)
def get_active_ats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active = get_active_resume(db, current_user.id)
    if not active:
        return AtsIntelligenceOut(
            analysis_ready=False,
            recommendations=["Upload and activate a resume to see ATS scoring."],
        )
    return compute_ats_for_resume(db, current_user, active.id)


@router.get("/{resume_id}", response_model=ResumeOut)
def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_user_resume(db, current_user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return _resume_out(resume)


@router.get("/{resume_id}/analysis", response_model=ResumeAnalysisOut)
def get_resume_analysis(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_user_resume(db, current_user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return _build_analysis_response(db, resume)


@router.get("/{resume_id}/ats", response_model=AtsIntelligenceOut)
def get_resume_ats(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_user_resume(db, current_user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return compute_ats_for_resume(db, current_user, resume_id)


@router.post("/{resume_id}/analyze", response_model=ResumeAnalyzeResponse)
def reanalyze_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-run rule-based parsing on an existing stored PDF (backfill / refresh)."""
    resume = get_user_resume(db, current_user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if not storage.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Resume storage is not configured.",
        )

    try:
        content = storage.download(resume.supabase_object_key)
    except SupabaseStorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to download resume for analysis: {exc}",
        ) from exc

    analysis_status = run_resume_analysis(db, current_user.id, resume_id, content)
    counts = get_analysis_counts(db, resume_id)
    message = (
        "Resume parsed successfully."
        if analysis_status == "completed"
        else "Resume analysis failed. Check parser logs or re-upload the PDF."
    )
    return ResumeAnalyzeResponse(
        analysis_status=analysis_status,
        summary=AnalysisSummaryBrief(**counts),
        message=message,
    )


@router.get("/{resume_id}/download")
def download_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_user_resume(db, current_user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if not storage.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Resume storage is not configured.",
        )

    try:
        content = storage.download(resume.supabase_object_key)
    except SupabaseStorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to download resume: {exc}",
        ) from exc

    return Response(
        content=content,
        media_type=resume.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{resume.file_name}"'},
    )


@router.post("/{resume_id}/activate", response_model=ResumeActivateResponse)
def activate(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_user_resume(db, current_user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    activate_resume(db, resume)
    db.commit()
    db.refresh(resume)
    return ResumeActivateResponse(resume=_resume_out(resume))


@router.delete("/{resume_id}", response_model=ResumeDeleteResponse)
def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = get_user_resume(db, current_user.id, resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    was_active = resume.is_active
    object_key = resume.supabase_object_key

    if storage.is_configured():
        try:
            storage.delete(object_key)
        except SupabaseStorageError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to delete resume file: {exc}",
            ) from exc

    db.delete(resume)
    db.commit()

    if was_active:
        next_resume = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id)
            .order_by(Resume.uploaded_at.desc())
            .first()
        )
        if next_resume:
            activate_resume(db, next_resume)
            db.commit()

    return ResumeDeleteResponse()
