from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Optional

from sqlalchemy.orm import Session

from .analysis_models import (
    ExtractedCertification,
    ExtractedEducation,
    ExtractedExperience,
    ExtractedProject,
    ExtractedSkill,
    ResumeAnalysis,
)
from .ats_schemas import AtsIntelligenceOut
from .ats_service import (
    _score_education,
    _score_experience,
    _score_projects,
    compute_ats_for_resume,
)
from .models import User
from .optimization_schemas import (
    AtsSimulatorActionOut,
    AtsSimulatorOut,
    ResumeOptimizationOut,
    SectionScoresOut,
)
from .resume_models import Resume
from .resume_service import get_user_resume

SUMMARY_HEADERS = re.compile(
    r"^(summary|professional summary|profile|about me|objective|career objective)\b",
    re.IGNORECASE,
)
BULLET_PATTERN = re.compile(r"^[\s]*(?:[•\-\*●▪◦]|\d+[\.\)])\s+", re.MULTILINE)
METRIC_TOKENS = ["%", "percent", "x", "k", "m", "million", "users", "ms", "hours", "days", "revenue", "saved"]


@dataclass
class OptimizationInput:
    resume_id: str
    resume_title: str = ""
    raw_text: str = ""
    resume_skills: List[str] = field(default_factory=list)
    experiences: List[ExtractedExperience] = field(default_factory=list)
    projects: List[ExtractedProject] = field(default_factory=list)
    education: List[ExtractedEducation] = field(default_factory=list)
    certifications: List[ExtractedCertification] = field(default_factory=list)
    analysis_status: str = "pending"
    ats: Optional[AtsIntelligenceOut] = None


def _has_metrics(text: str) -> bool:
    if not text:
        return False
    has_number = any(ch.isdigit() for ch in text)
    has_token = any(tok in text.lower() for tok in METRIC_TOKENS)
    return has_number and has_token


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


def _summary_section_text(raw_text: str) -> str:
    if not raw_text:
        return ""
    lines = raw_text.split("\n")
    capturing = False
    chunks: List[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if capturing and chunks:
                break
            continue
        if SUMMARY_HEADERS.match(stripped):
            capturing = True
            remainder = SUMMARY_HEADERS.sub("", stripped).strip(" :-")
            if remainder:
                chunks.append(remainder)
            continue
        if capturing:
            if stripped.isupper() and len(stripped) < 40:
                break
            chunks.append(stripped)
    return " ".join(chunks).strip()


def _score_summary(resume_title: str, raw_text: str) -> int:
    if _headline_is_weak(resume_title, raw_text):
        headline_score = 35
    else:
        headline_score = 85

    summary_text = _summary_section_text(raw_text)
    if not summary_text:
        summary_body_score = 25
    elif len(summary_text) < 40:
        summary_body_score = 45
    elif len(summary_text) < 120:
        summary_body_score = 70
    else:
        summary_body_score = 90

    return int(round((headline_score + summary_body_score) / 2))


def _score_skills_section(ats: AtsIntelligenceOut, resume_skills: List[str]) -> int:
    for item in ats.score_breakdown:
        if item.category == "skills_match":
            return item.score
    if resume_skills:
        return 55
    return 25


def _keyword_coverage(ats: AtsIntelligenceOut) -> int:
    if ats.target_skill_count <= 0:
        return 0
    matched = len(ats.matched_skills)
    ratio = matched / ats.target_skill_count
    return min(100, int(round(ratio * 100)))


def _count_bullets(experiences: List[ExtractedExperience]) -> int:
    total = 0
    for exp in experiences:
        desc = exp.description or ""
        total += len(BULLET_PATTERN.findall(desc))
        if not BULLET_PATTERN.search(desc) and desc.strip():
            total += max(1, len([ln for ln in desc.split("\n") if ln.strip()]))
    return total


def _recruiter_readability(inp: OptimizationInput) -> int:
    score = 30

    sections_present = sum(
        [
            bool(inp.resume_skills),
            bool(inp.experiences),
            bool(inp.projects),
            bool(inp.education),
        ]
    )
    score += sections_present * 10

    bullets = _count_bullets(inp.experiences)
    if bullets >= 8:
        score += 20
    elif bullets >= 4:
        score += 12
    elif bullets >= 1:
        score += 6
    else:
        score += 0

    if inp.experiences:
        with_metrics = sum(1 for exp in inp.experiences if _has_metrics(exp.description or ""))
        metric_ratio = with_metrics / max(len(inp.experiences), 1)
        score += int(metric_ratio * 20)

    if inp.projects:
        deep_projects = sum(
            1 for p in inp.projects if p.description and len(p.description.strip()) >= 60
        )
        project_ratio = deep_projects / max(len(inp.projects), 1)
        score += int(project_ratio * 15)

    if not _headline_is_weak(inp.resume_title, inp.raw_text):
        score += 5

    return min(100, score)


def _completeness_score(ats: AtsIntelligenceOut) -> int:
    for item in ats.score_breakdown:
        if item.category == "completeness":
            return item.score
    return 40 if ats.analysis_ready else 20


def _health_score(
    ats_score: int,
    completeness: int,
    section_scores: SectionScoresOut,
) -> int:
    section_avg = (
        section_scores.summary
        + section_scores.skills
        + section_scores.projects
        + section_scores.experience
        + section_scores.education
    ) / 5
    return int(round(ats_score * 0.4 + completeness * 0.2 + section_avg * 0.4))


def _build_strengths(
    inp: OptimizationInput,
    ats: AtsIntelligenceOut,
    section_scores: SectionScoresOut,
) -> List[str]:
    strengths: List[str] = list(ats.strengths[:4])

    if section_scores.summary >= 75 and not _headline_is_weak(inp.resume_title, inp.raw_text):
        strengths.append("Professional summary and headline are recruiter-ready")

    if section_scores.skills >= 70:
        strengths.append(f"Strong keyword alignment for {ats.detected_role or ats.target_role}")

    if section_scores.experience >= 70:
        strengths.append("Experience section demonstrates clear impact")

    if section_scores.projects >= 70 and inp.projects:
        strengths.append("Projects provide credible evidence of applied skills")

    if section_scores.education >= 70 and inp.education:
        strengths.append("Education credentials are clearly documented")

    if _count_bullets(inp.experiences) >= 6:
        strengths.append("Resume uses scannable bullet structure")

    return list(dict.fromkeys(strengths))[:6]


def _build_improvements(
    inp: OptimizationInput,
    ats: AtsIntelligenceOut,
    section_scores: SectionScoresOut,
) -> List[str]:
    improvements: List[str] = list(ats.weaknesses[:4])

    if ats.missing_skills:
        improvements.append(
            "Add missing ATS keywords: " + ", ".join(ats.missing_skills[:5])
        )

    if section_scores.summary < 60:
        improvements.append("Strengthen headline and professional summary for your target role")

    if section_scores.experience < 65:
        improvements.append("Add quantified achievements to experience bullets")

    if section_scores.projects < 65:
        improvements.append("Expand project descriptions with tech stack and outcomes")

    if section_scores.education < 60 and not inp.education:
        improvements.append("Include an education section with degree and institution")

    if not inp.resume_skills:
        improvements.append("Add a dedicated skills section with role-relevant keywords")

    if inp.analysis_status != "completed":
        improvements.insert(0, "Re-analyze resume to refresh parsed data before optimizing")

    return list(dict.fromkeys(improvements))[:8]


def _build_simulator_actions(
    inp: OptimizationInput,
    ats: AtsIntelligenceOut,
    section_scores: SectionScoresOut,
) -> List[AtsSimulatorActionOut]:
    actions: List[AtsSimulatorActionOut] = []

    if ats.missing_skills:
        gain = min(12, 4 + len(ats.missing_skills) // 2)
        actions.append(
            AtsSimulatorActionOut(
                title="Close ATS skill gaps for " + (ats.detected_role or "your role"),
                estimated_gain=gain,
            )
        )

    if section_scores.experience < 70:
        gain = 7 if section_scores.experience < 55 else 4
        actions.append(
            AtsSimulatorActionOut(
                title="Add measurable impact to experience bullets",
                estimated_gain=gain,
            )
        )

    if _headline_is_weak(inp.resume_title, inp.raw_text) or section_scores.summary < 65:
        actions.append(
            AtsSimulatorActionOut(
                title="Strengthen headline and professional summary",
                estimated_gain=8,
            )
        )

    if section_scores.projects < 72 and inp.projects:
        actions.append(
            AtsSimulatorActionOut(
                title="Expand project descriptions with outcomes",
                estimated_gain=5,
            )
        )

    if not inp.education:
        actions.append(
            AtsSimulatorActionOut(
                title="Add education section with degree details",
                estimated_gain=4,
            )
        )

    if not inp.certifications:
        actions.append(
            AtsSimulatorActionOut(
                title="Add certifications or notable credentials",
                estimated_gain=3,
            )
        )

    actions.sort(key=lambda a: a.estimated_gain, reverse=True)
    return actions[:3]


def compute_resume_optimization(inp: OptimizationInput) -> ResumeOptimizationOut:
    ats = inp.ats or AtsIntelligenceOut()
    detected_role = ats.detected_role or ats.target_role or "your target role"

    exp_score, _, _ = _score_experience(inp.experiences, detected_role)
    edu_score, _, _ = _score_education(inp.education)
    proj_score, _, _ = _score_projects(inp.projects)

    section_scores = SectionScoresOut(
        summary=_score_summary(inp.resume_title, inp.raw_text),
        skills=_score_skills_section(ats, inp.resume_skills),
        projects=proj_score,
        experience=exp_score,
        education=edu_score,
    )

    ats_score = ats.ats_score
    completeness = _completeness_score(ats)
    keyword_cov = _keyword_coverage(ats)
    readability = _recruiter_readability(inp)
    health = _health_score(ats_score, completeness, section_scores)

    strengths = _build_strengths(inp, ats, section_scores)
    improvements = _build_improvements(inp, ats, section_scores)
    actions = _build_simulator_actions(inp, ats, section_scores)
    projected = min(100, ats_score + sum(a.estimated_gain for a in actions))

    return ResumeOptimizationOut(
        health_score=health,
        ats_readiness=ats_score,
        keyword_coverage=keyword_cov,
        recruiter_readability=readability,
        section_scores=section_scores,
        strengths=strengths,
        improvements=improvements,
        ats_simulator=AtsSimulatorOut(
            current_score=ats_score,
            projected_score=projected,
            actions=actions,
        ),
    )


def compute_resume_optimization_for_resume(
    db: Session,
    user: User,
    resume_id: str,
) -> ResumeOptimizationOut:
    resume = get_user_resume(db, user.id, resume_id)
    if not resume:
        return ResumeOptimizationOut()

    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume_id).first()
    resume_skills = [
        s.skill for s in db.query(ExtractedSkill).filter(ExtractedSkill.resume_id == resume_id).all()
    ]
    experiences = db.query(ExtractedExperience).filter(ExtractedExperience.resume_id == resume_id).all()
    projects = db.query(ExtractedProject).filter(ExtractedProject.resume_id == resume_id).all()
    education = db.query(ExtractedEducation).filter(ExtractedEducation.resume_id == resume_id).all()
    certifications = (
        db.query(ExtractedCertification).filter(ExtractedCertification.resume_id == resume_id).all()
    )

    ats = compute_ats_for_resume(db, user, resume_id)

    inp = OptimizationInput(
        resume_id=resume_id,
        resume_title=resume.title if isinstance(resume, Resume) else "",
        raw_text=analysis.raw_text if analysis and analysis.raw_text else "",
        resume_skills=resume_skills,
        experiences=experiences,
        projects=projects,
        education=education,
        certifications=certifications,
        analysis_status=analysis.status if analysis else "pending",
        ats=ats,
    )
    return compute_resume_optimization(inp)
