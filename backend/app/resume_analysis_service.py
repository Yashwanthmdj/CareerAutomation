from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.orm import Session

from .analysis_models import (
    ExtractedCertification,
    ExtractedEducation,
    ExtractedExperience,
    ExtractedProject,
    ExtractedSkill,
    ResumeAnalysis,
)
from .resume_parser import ParsedResume, parse_resume

logger = logging.getLogger(__name__)


def clear_extracted_data(db: Session, resume_id: str) -> None:
    db.query(ExtractedSkill).filter(ExtractedSkill.resume_id == resume_id).delete()
    db.query(ExtractedProject).filter(ExtractedProject.resume_id == resume_id).delete()
    db.query(ExtractedEducation).filter(ExtractedEducation.resume_id == resume_id).delete()
    db.query(ExtractedExperience).filter(ExtractedExperience.resume_id == resume_id).delete()
    db.query(ExtractedCertification).filter(ExtractedCertification.resume_id == resume_id).delete()
    db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume_id).delete()


def store_parsed_resume(
    db: Session,
    user_id: str,
    resume_id: str,
    parsed: ParsedResume,
    status: str = "completed",
    error_message: Optional[str] = None,
) -> ResumeAnalysis:
    clear_extracted_data(db, resume_id)

    analysis = ResumeAnalysis(
        resume_id=resume_id,
        user_id=user_id,
        raw_text=parsed.raw_text[:500_000] if parsed.raw_text else None,
        status=status,
        error_message=error_message,
    )
    db.add(analysis)
    db.flush()

    for skill in parsed.skills:
        db.add(ExtractedSkill(user_id=user_id, resume_id=resume_id, skill=skill))

    for edu in parsed.education:
        db.add(
            ExtractedEducation(
                user_id=user_id,
                resume_id=resume_id,
                college=edu.college,
                degree=edu.degree,
                graduation_year=edu.graduation_year,
                cgpa=edu.cgpa,
            )
        )

    for project in parsed.projects:
        db.add(
            ExtractedProject(
                user_id=user_id,
                resume_id=resume_id,
                project_name=project.project_name,
                description=project.description,
                technologies=project.technologies,
            )
        )

    for exp in parsed.experience:
        db.add(
            ExtractedExperience(
                user_id=user_id,
                resume_id=resume_id,
                company=exp.company,
                role=exp.role,
                duration=exp.duration,
                description=exp.description,
            )
        )

    for cert in parsed.certifications:
        db.add(
            ExtractedCertification(
                user_id=user_id,
                resume_id=resume_id,
                certification_name=cert.certification_name,
            )
        )

    return analysis


def store_failed_analysis(
    db: Session,
    user_id: str,
    resume_id: str,
    error_message: str,
    raw_text: Optional[str] = None,
) -> ResumeAnalysis:
    clear_extracted_data(db, resume_id)
    analysis = ResumeAnalysis(
        resume_id=resume_id,
        user_id=user_id,
        raw_text=raw_text[:500_000] if raw_text else None,
        status="failed",
        error_message=error_message[:2000],
    )
    db.add(analysis)
    return analysis


def run_resume_analysis(db: Session, user_id: str, resume_id: str, pdf_bytes: bytes) -> str:
    """
    Parse resume and persist structured data. Never raises — returns status string.
    Upload flow must not depend on this succeeding.
    """
    try:
        parsed = parse_resume(pdf_bytes)
        logger.info(
            "[Parser] Analysis complete for resume_id=%s — skills=%d projects=%d "
            "experience=%d education=%d certifications=%d",
            resume_id,
            len(parsed.skills),
            len(parsed.projects),
            len(parsed.experience),
            len(parsed.education),
            len(parsed.certifications),
        )
        store_parsed_resume(db, user_id, resume_id, parsed, status="completed")
        db.commit()
        return "completed"
    except Exception as exc:
        logger.exception("Resume analysis failed for resume_id=%s", resume_id)
        db.rollback()
        try:
            raw = ""
            try:
                from .resume_parser import extract_text_from_pdf

                raw = extract_text_from_pdf(pdf_bytes)
            except Exception:
                pass
            store_failed_analysis(db, user_id, resume_id, str(exc), raw_text=raw or None)
            db.commit()
        except Exception:
            logger.exception("Failed to store analysis failure record")
            db.rollback()
        return "failed"


def get_analysis_counts(db: Session, resume_id: str) -> dict:
    return {
        "skills_count": db.query(ExtractedSkill).filter(ExtractedSkill.resume_id == resume_id).count(),
        "projects_count": db.query(ExtractedProject).filter(ExtractedProject.resume_id == resume_id).count(),
        "education_count": db.query(ExtractedEducation).filter(ExtractedEducation.resume_id == resume_id).count(),
        "experience_count": db.query(ExtractedExperience).filter(ExtractedExperience.resume_id == resume_id).count(),
        "certifications_count": db.query(ExtractedCertification)
        .filter(ExtractedCertification.resume_id == resume_id)
        .count(),
    }
