from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from .deps import get_current_user
from .models import User
from .parser_schemas import ParserBenchmarkOut, ParserDiagnosticsOut
from .resume_parser import parse_resume
from .resume_service import validate_pdf_upload

router = APIRouter(prefix="/resumes/parser", tags=["resume-parser"])


def _to_benchmark_out(parsed) -> ParserBenchmarkOut:
    d = parsed.diagnostics
    return ParserBenchmarkOut(
        diagnostics=ParserDiagnosticsOut(
            raw_text_length=d.raw_text_length,
            detected_sections=d.detected_sections,
            extraction_counts=d.extraction_counts,
            parser_confidence=d.parser_confidence,
            confidence_breakdown=d.confidence_breakdown,
        ),
        skills=parsed.skills,
        experience=[
            {
                "company": e.company,
                "role": e.role,
                "duration": e.duration,
                "description": e.description,
            }
            for e in parsed.experience
        ],
        education=[
            {
                "college": ed.college,
                "degree": ed.degree,
                "graduation_year": ed.graduation_year,
                "cgpa": ed.cgpa,
            }
            for ed in parsed.education
        ],
        projects=[
            {
                "project_name": p.project_name,
                "description": p.description,
                "technologies": p.technologies,
            }
            for p in parsed.projects
        ],
        certifications=[c.certification_name for c in parsed.certifications],
    )


@router.post("/benchmark", response_model=ParserBenchmarkOut)
async def parser_benchmark(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Parse a PDF and return extraction diagnostics without saving (dev / QA)."""
    _ = current_user  # auth required; no persistence
    file_name = (file.filename or "resume.pdf").strip()
    content = await file.read()

    try:
        validate_pdf_upload(file_name, file.content_type, content)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    try:
        parsed = parse_resume(content)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Parser failed: {exc}",
        ) from exc

    return _to_benchmark_out(parsed)
