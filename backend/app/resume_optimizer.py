from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .analysis_models import (
    ExtractedCertification,
    ExtractedExperience,
    ExtractedProject,
    ResumeAnalysis,
)
from .ats_service import compute_ats_for_resume
from .models import User
from .resume_models import Resume
from .resume_service import get_user_resume


class OptimizationItemOut(BaseModel):
    priority: str = Field(pattern="^(High|Medium|Low)$")
    title: str
    recommendation: str
    rationale: str
    estimated_gain: int = Field(ge=0, le=25)


class ResumeOptimizationOut(BaseModel):
    health_score: int = Field(ge=0, le=100)
    estimated_ats_gain: int = Field(ge=0, le=40)
    optimization_items: List[OptimizationItemOut] = []
    section_scores: Dict[str, int] = {}
    keyword_gaps: List[str] = []
    impact_summary: str = ""


@dataclass
class OptimizerInput:
    resume_id: str
    resume_title: str = ""
    raw_text: str = ""
    experiences: List[ExtractedExperience] = field(default_factory=list)
    projects: List[ExtractedProject] = field(default_factory=list)
    certifications: List[ExtractedCertification] = field(default_factory=list)


def _headline_is_weak(resume_title: str, raw_text: str) -> bool:
    generic = {
        "resume",
        "curriculum vitae",
        "cv",
        "software engineer",
        "developer",
        "engineer",
        "student",
    }
    title = (resume_title or "").strip().lower()
    header_line = ""
    for line in raw_text.split("\n"):
        stripped = line.strip()
        if stripped:
            header_line = stripped
            break
    header = header_line.lower()
    if not title and not header:
        return True
    if title in generic:
        return True
    if header in generic:
        return True
    if len(title) < 5 and len(header) < 10:
        return True
    return False


def _has_metrics(text: str) -> bool:
    if not text:
        return False
    metric_tokens = ["%", "percent", "x", "k", "m", "million", "users", "ms", "hours", "days"]
    has_number = any(ch.isdigit() for ch in text)
    has_token = any(tok in text.lower() for tok in metric_tokens)
    return has_number and has_token


def _experience_metrics_score(experiences: List[ExtractedExperience]) -> int:
    if not experiences:
        return 35
    with_metrics = sum(1 for exp in experiences if _has_metrics(exp.description or ""))
    ratio = with_metrics / max(len(experiences), 1)
    return min(100, 40 + int(ratio * 60))


def _projects_depth_score(projects: List[ExtractedProject]) -> int:
    if not projects:
        return 30
    long_desc = sum(1 for p in projects if (p.description and len(p.description.strip()) >= 80))
    ratio = long_desc / max(len(projects), 1)
    return min(100, 45 + int(ratio * 55))


def _certifications_score(certs: List[ExtractedCertification]) -> int:
    if not certs:
        return 30
    return min(100, 55 + min(45, len(certs) * 10))


def _headline_score(resume_title: str, raw_text: str) -> int:
    return 45 if _headline_is_weak(resume_title, raw_text) else 85


def _priority_from_gain(gain: int) -> str:
    if gain >= 8:
        return "High"
    if gain >= 4:
        return "Medium"
    return "Low"


def compute_resume_optimization(optimizer_input: OptimizerInput, keyword_gaps: List[str]) -> ResumeOptimizationOut:
    items: List[OptimizationItemOut] = []

    if keyword_gaps:
        gain = min(12, 4 + len(keyword_gaps) // 2)
        items.append(
            OptimizationItemOut(
                priority=_priority_from_gain(gain),
                title="Close ATS skill gaps",
                recommendation=(
                    "Add relevant missing keywords in Skills/Experience where truthful: "
                    + ", ".join(keyword_gaps[:6])
                    + "."
                ),
                rationale="Missing ATS keywords reduce role-skill alignment.",
                estimated_gain=gain,
            )
        )

    if _headline_is_weak(optimizer_input.resume_title, optimizer_input.raw_text):
        items.append(
            OptimizationItemOut(
                priority="High",
                title="Strengthen headline",
                recommendation=(
                    "Use a role-focused headline such as 'Frontend Developer | React, TypeScript, Web Performance'."
                ),
                rationale="A weak/generic headline hurts recruiter scanability and ATS context.",
                estimated_gain=8,
            )
        )

    exp_score = _experience_metrics_score(optimizer_input.experiences)
    if exp_score < 70:
        items.append(
            OptimizationItemOut(
                priority="High" if exp_score < 55 else "Medium",
                title="Add measurable impact to experience bullets",
                recommendation="Include numbers (%, users, latency, revenue, time saved) in each major bullet.",
                rationale="Metric-rich bullets improve relevance and recruiter confidence.",
                estimated_gain=7 if exp_score < 55 else 4,
            )
        )

    proj_score = _projects_depth_score(optimizer_input.projects)
    if proj_score < 72:
        items.append(
            OptimizationItemOut(
                priority="Medium",
                title="Expand project descriptions",
                recommendation="Describe problem, tech stack, and measurable outcomes in 2-4 bullets per project.",
                rationale="Short project entries reduce evidence of applied skills.",
                estimated_gain=5,
            )
        )

    cert_score = _certifications_score(optimizer_input.certifications)
    if cert_score < 55:
        items.append(
            OptimizationItemOut(
                priority="Low",
                title="Add certifications or notable credentials",
                recommendation="Include relevant certifications, coursework, or validated achievements.",
                rationale="Credentials can improve ATS credibility signals.",
                estimated_gain=3,
            )
        )

    section_scores = {
        "headline": _headline_score(optimizer_input.resume_title, optimizer_input.raw_text),
        "skills_alignment": max(0, min(100, 100 - len(keyword_gaps) * 8)),
        "experience_impact": exp_score,
        "project_depth": proj_score,
        "certifications": cert_score,
    }

    health_score = int(round(sum(section_scores.values()) / len(section_scores)))
    estimated_ats_gain = min(40, sum(i.estimated_gain for i in items))

    if items:
        top = items[0]
        impact_summary = (
            f"{len(items)} optimization opportunities found. "
            f"Top priority: {top.title}. Estimated ATS gain up to +{estimated_ats_gain}."
        )
    else:
        impact_summary = "Resume quality is strong. No major optimization gaps detected."

    return ResumeOptimizationOut(
        health_score=health_score,
        estimated_ats_gain=estimated_ats_gain,
        optimization_items=items[:8],
        section_scores=section_scores,
        keyword_gaps=keyword_gaps[:15],
        impact_summary=impact_summary,
    )


def compute_resume_optimization_for_resume(db: Session, user: User, resume_id: str) -> ResumeOptimizationOut:
    resume = get_user_resume(db, user.id, resume_id)
    if not resume:
        return ResumeOptimizationOut(
            health_score=0,
            estimated_ats_gain=0,
            impact_summary="Resume not found.",
        )

    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume_id).first()
    experiences = db.query(ExtractedExperience).filter(ExtractedExperience.resume_id == resume_id).all()
    projects = db.query(ExtractedProject).filter(ExtractedProject.resume_id == resume_id).all()
    certifications = db.query(ExtractedCertification).filter(ExtractedCertification.resume_id == resume_id).all()

    ats = compute_ats_for_resume(db, user, resume_id)
    optimizer_input = OptimizerInput(
        resume_id=resume_id,
        resume_title=resume.title if isinstance(resume, Resume) else "",
        raw_text=analysis.raw_text if analysis and analysis.raw_text else "",
        experiences=experiences,
        projects=projects,
        certifications=certifications,
    )
    return compute_resume_optimization(optimizer_input, ats.missing_skills)
