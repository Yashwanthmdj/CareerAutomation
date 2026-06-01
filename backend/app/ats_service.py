from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import List, Optional, Set

from sqlalchemy.orm import Session

from .analysis_models import (
    ExtractedCertification,
    ExtractedEducation,
    ExtractedExperience,
    ExtractedProject,
    ExtractedSkill,
    ResumeAnalysis,
)
from .ats_schemas import AtsIntelligenceOut, FamilyMatchItem, ScoreBreakdownItem, SkillNormalizationItem
from .ats_skill_intelligence import (
    compute_skills_alignment_score,
    match_resume_to_targets,
    resolve_ats_role,
    role_detection_source_label,
    role_track_label,
    skills_are_equivalent,
    skills_for_role_track,
    target_skills_for_role,
)
from .career_service import ensure_career_records
from .models import User
from .resume_models import Resume
from .resume_service import get_user_resume

logger = logging.getLogger(__name__)

WEIGHTS = {
    "skills_match": ("Skills alignment", 35),
    "experience": ("Experience", 20),
    "education": ("Education", 12),
    "projects": ("Projects", 13),
    "certifications": ("Certifications", 10),
    "completeness": ("Resume completeness", 10),
}


@dataclass
class AtsInput:
    resume_skills: List[str] = field(default_factory=list)
    education: List[ExtractedEducation] = field(default_factory=list)
    projects: List[ExtractedProject] = field(default_factory=list)
    experience: List[ExtractedExperience] = field(default_factory=list)
    certifications: List[ExtractedCertification] = field(default_factory=list)
    profile_skills: List[str] = field(default_factory=list)
    preferred_roles: List[str] = field(default_factory=list)
    preferred_locations: List[str] = field(default_factory=list)
    analysis_status: str = "pending"
    current_status: Optional[str] = None
    resume_title: str = ""
    resume_header: str = ""


def _extract_resume_header(raw_text: Optional[str], max_lines: int = 10) -> str:
    if not raw_text:
        return ""
    lines = [ln.strip() for ln in raw_text.split("\n")[:max_lines] if ln.strip()]
    return " ".join(lines)


def _score_skills(
    resume_skills: List[str],
    target_skills: Set[str],
) -> tuple[int, Set[str], List[str]]:
    if not target_skills:
        return (70 if resume_skills else 30, set(), [])

    result = match_resume_to_targets(resume_skills, target_skills)
    if result.target_count == 0:
        return (70 if resume_skills else 30, set(), [])

    ratio = result.match_count / result.target_count
    score = int(min(100, round(ratio * 100 * 1.08)))
    return score, result.matched_targets, result.missing_targets


def _score_experience(
    experience: List[ExtractedExperience],
    detected_role: str,
) -> tuple[int, List[str], List[str]]:
    notes_strength: List[str] = []
    notes_weak: List[str] = []
    if not experience:
        notes_weak.append("No work experience section detected on the resume.")
        return 25, notes_strength, notes_weak

    score = 45
    primary = experience[0]
    if primary.role:
        score += 15
        notes_strength.append(f"Clear role title: {primary.role}")
    if primary.duration:
        score += 10
        notes_strength.append(f"Employment dates present ({primary.duration})")
    desc = primary.description or ""
    if len(desc) > 80:
        score += 20
        notes_strength.append("Experience includes measurable bullet points")
    elif len(desc) > 20:
        score += 10
    else:
        notes_weak.append("Experience bullets are thin — add quantified outcomes")

    role_blob = detected_role.lower()
    if role_blob and primary.role and any(k in primary.role.lower() for k in role_blob.split()):
        score += 10
        notes_strength.append(f"Experience aligns with detected role: {detected_role}")

    return min(100, score), notes_strength, notes_weak


def _score_education(education: List[ExtractedEducation]) -> tuple[int, List[str], List[str]]:
    strengths: List[str] = []
    weaknesses: List[str] = []
    if not education:
        weaknesses.append("Education section missing or not parsed")
        return 30, strengths, weaknesses

    score = 50
    if len(education) >= 1:
        score += 20
        strengths.append(f"{len(education)} education entr{'y' if len(education) == 1 else 'ies'} listed")
    if len(education) >= 2:
        score += 10
        strengths.append("Multiple education credentials strengthen ATS filters")

    has_degree = any(e.degree for e in education)
    if has_degree:
        score += 15
        strengths.append("Degree information is present")
    else:
        weaknesses.append("Degree field not clearly identified")

    has_institution = any(e.college for e in education)
    if has_institution:
        score += 5

    return min(100, score), strengths, weaknesses


def _score_projects(projects: List[ExtractedProject]) -> tuple[int, List[str], List[str]]:
    strengths: List[str] = []
    weaknesses: List[str] = []
    if not projects:
        weaknesses.append("No projects detected — add 2–3 strong technical projects")
        return 25, strengths, weaknesses

    score = 40
    count = len(projects)
    if count >= 2:
        score += 25
        strengths.append(f"{count} projects showcase applied skills")
    elif count == 1:
        score += 15
        strengths.append("At least one project listed")

    with_tech = sum(1 for p in projects if p.technologies and len(p.technologies) > 5)
    if with_tech >= 2:
        score += 20
        strengths.append("Projects include technology keywords for ATS")
    elif with_tech == 1:
        score += 10

    with_desc = sum(1 for p in projects if p.description and len(p.description) > 40)
    if with_desc >= 2:
        score += 15
    else:
        weaknesses.append("Add impact metrics and tech stack to project descriptions")

    return min(100, score), strengths, weaknesses


def _score_certifications(certifications: List[ExtractedCertification]) -> tuple[int, List[str], List[str]]:
    strengths: List[str] = []
    weaknesses: List[str] = []
    if not certifications:
        weaknesses.append("No certifications or awards listed")
        return 35, strengths, weaknesses

    count = len(certifications)
    score = 50 + min(50, count * 8)
    strengths.append(f"{count} certification/award{'s' if count != 1 else ''} improve credibility")
    if count >= 4:
        score = min(100, score + 10)
    return min(100, score), strengths, weaknesses


def _score_completeness(data: AtsInput) -> tuple[int, List[str], List[str]]:
    strengths: List[str] = []
    weaknesses: List[str] = []
    if data.analysis_status != "completed":
        weaknesses.append("Resume parsing incomplete — re-upload or use Re-analyze for full ATS scoring")
        return 20, strengths, weaknesses

    score = 60
    checks = [
        (bool(data.resume_skills), "Skills section populated"),
        (bool(data.experience), "Experience section populated"),
        (bool(data.projects), "Projects section populated"),
        (bool(data.education), "Education section populated"),
        (bool(data.certifications), "Certifications section populated"),
    ]
    passed = sum(1 for ok, _ in checks if ok)
    score += passed * 8
    for ok, label in checks:
        if ok:
            strengths.append(label)
        else:
            weaknesses.append(f"Missing: {label.lower()}")

    return min(100, score), strengths, weaknesses


def _grade_from_score(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Strong"
    if score >= 55:
        return "Good"
    if score >= 40:
        return "Fair"
    return "Needs work"


def _role_priority_missing(resume_skills: List[str], track: str) -> List[str]:
    missing: List[str] = []
    for skill in skills_for_role_track(track):
        if any(skills_are_equivalent(skill, rs) for rs in resume_skills):
            continue
        missing.append(skill)
    return missing


def _build_recommendations(
    missing_skills: List[str],
    weaknesses: List[str],
    breakdown: List[ScoreBreakdownItem],
    resume_skills: List[str],
    role_track: str,
    detected_role: str,
) -> List[str]:
    recs: List[str] = []
    weak_cats = [b for b in breakdown if b.score < 60]
    for cat in weak_cats[:2]:
        recs.append(f"Improve {cat.label.lower()} (currently {cat.score}/100) to raise your ATS score.")

    track_missing = _role_priority_missing(resume_skills, role_track)
    if track_missing:
        recs.append(
            f"For {detected_role} roles, add these skills if accurate: "
            + ", ".join(track_missing[:5])
            + "."
        )
    elif missing_skills:
        recs.append(
            "Strengthen your skills section with: " + ", ".join(missing_skills[:5]) + "."
        )

    recs.append(f"Tailor headline and summary for: {detected_role}.")
    recs.append("Use standard section headers (Experience, Projects, Education, Technical Skills).")
    recs.append("Quantify impact with metrics (%, time saved, users served) in bullets.")

    if any("project" in w.lower() for w in weaknesses):
        recs.append("Add 2–3 projects with GitHub links, year, and tech stack per project.")

    return recs[:6]


def compute_ats_intelligence(data: AtsInput) -> AtsIntelligenceOut:
    resume_skills = list(data.resume_skills)
    experience_roles = [e.role for e in data.experience if e.role]

    role_result = resolve_ats_role(
        preferred_roles=data.preferred_roles,
        resume_skills=resume_skills,
        resume_title=data.resume_title,
        resume_header=data.resume_header,
        experience_roles=experience_roles,
    )
    detected_role = role_result.display_role
    target_skills = target_skills_for_role(role_result.track)
    target_skill_list = sorted(target_skills, key=str.lower)

    match_result = match_resume_to_targets(resume_skills, target_skills)
    skills_score = compute_skills_alignment_score(match_result)
    matched = match_result.matched_targets
    missing_list = match_result.missing_targets
    matched_list = sorted(matched, key=str.lower)
    direct_matches_list = list(match_result.direct_matches)
    family_matches_list = [
        FamilyMatchItem(
            target_skill=fm.target_skill,
            resume_skill=fm.resume_skill,
            family=fm.family,
        )
        for fm in match_result.family_matches
    ]
    resume_skills_normalized = [
        SkillNormalizationItem(raw=e.raw, normalized=e.normalized)
        for e in match_result.resume_normalizations
    ]
    target_skills_normalized = [
        SkillNormalizationItem(raw=e.raw, normalized=e.normalized)
        for e in match_result.target_normalizations
    ]

    exp_score, exp_s, exp_w = _score_experience(data.experience, detected_role)
    edu_score, edu_s, edu_w = _score_education(data.education)
    proj_score, proj_s, proj_w = _score_projects(data.projects)
    cert_score, cert_s, cert_w = _score_certifications(data.certifications)
    comp_score, comp_s, comp_w = _score_completeness(data)

    category_scores = {
        "skills_match": skills_score,
        "experience": exp_score,
        "education": edu_score,
        "projects": proj_score,
        "certifications": cert_score,
        "completeness": comp_score,
    }

    breakdown: List[ScoreBreakdownItem] = []
    total = 0
    for key, (label, weight) in WEIGHTS.items():
        cat_score = category_scores[key]
        detail_parts = []
        if key == "skills_match":
            detail_parts.append(
                f"{match_result.direct_match_count} direct, {match_result.family_match_count} family "
                f"· {len(matched)}/{len(target_skills)} covered"
            )
        breakdown.append(
            ScoreBreakdownItem(
                category=key,
                label=label,
                score=cat_score,
                weight=weight,
                detail=" · ".join(detail_parts) if detail_parts else "",
            )
        )
        total += round(cat_score * weight / 100)

    ats_score = min(100, max(0, total))
    missing_skills = missing_list[:15]

    all_strengths = exp_s + edu_s + proj_s + cert_s + comp_s
    if match_result.direct_match_count >= 5:
        all_strengths.insert(
            0,
            f"Strong {detected_role} skill coverage "
            f"({match_result.direct_match_count} direct, {match_result.family_match_count} family)",
        )
    elif len(matched) >= 3:
        all_strengths.insert(
            0,
            f"Solid {detected_role} skill coverage "
            f"({match_result.direct_match_count} direct, {match_result.family_match_count} family)",
        )

    all_weaknesses = exp_w + edu_w + proj_w + cert_w + comp_w
    if skills_score < 60 and missing_skills:
        all_weaknesses.insert(0, f"{len(missing_skills)} skills missing for {detected_role}")

    strengths = list(dict.fromkeys(all_strengths))[:6]
    weaknesses = list(dict.fromkeys(all_weaknesses))[:6]
    recommendations = _build_recommendations(
        missing_skills,
        weaknesses,
        breakdown,
        resume_skills,
        role_result.track,
        detected_role,
    )

    source_label = role_detection_source_label(role_result.source)

    logger.info(
        "[ATS] Score=%d detected_role=%s source=%s resume_skills=%d target_skills=%d matched=%d",
        ats_score,
        detected_role,
        role_result.source,
        len(resume_skills),
        len(target_skills),
        len(matched),
    )

    return AtsIntelligenceOut(
        ats_score=ats_score,
        grade=_grade_from_score(ats_score),
        score_breakdown=breakdown,
        missing_skills=missing_skills,
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
        target_role=detected_role,
        detected_role=detected_role,
        role_detection_source=source_label,
        matched_skills=matched_list,
        direct_matches=direct_matches_list,
        family_matches=family_matches_list,
        target_skill_set=target_skill_list,
        resume_skills_normalized=resume_skills_normalized,
        target_skills_normalized=target_skills_normalized,
        resume_skill_count=len(resume_skills),
        target_skill_count=len(target_skills),
        analysis_ready=data.analysis_status == "completed",
    )


def load_ats_input_for_resume(db: Session, user: User, resume_id: str) -> Optional[AtsInput]:
    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume_id).first()
    status = analysis.status if analysis else "pending"
    raw_text = analysis.raw_text if analysis else None

    resume_row = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user.id).first()
    resume_title = resume_row.title if resume_row else ""

    resume_skills = [
        s.skill for s in db.query(ExtractedSkill).filter(ExtractedSkill.resume_id == resume_id).all()
    ]
    education = db.query(ExtractedEducation).filter(ExtractedEducation.resume_id == resume_id).all()
    projects = db.query(ExtractedProject).filter(ExtractedProject.resume_id == resume_id).all()
    experience = db.query(ExtractedExperience).filter(ExtractedExperience.resume_id == resume_id).all()
    certifications = (
        db.query(ExtractedCertification).filter(ExtractedCertification.resume_id == resume_id).all()
    )

    _, profile, preferences = ensure_career_records(db, user)
    db.refresh(user)
    profile_skills = [s.name for s in user.skills]

    return AtsInput(
        resume_skills=resume_skills,
        education=education,
        projects=projects,
        experience=experience,
        certifications=certifications,
        profile_skills=profile_skills,
        preferred_roles=preferences.preferred_roles or [],
        preferred_locations=preferences.preferred_locations or [],
        analysis_status=status,
        current_status=profile.current_status,
        resume_title=resume_title,
        resume_header=_extract_resume_header(raw_text),
    )


def compute_ats_for_resume(db: Session, user: User, resume_id: str) -> AtsIntelligenceOut:
    if not get_user_resume(db, user.id, resume_id):
        return AtsIntelligenceOut(
            analysis_ready=False,
            recommendations=["Upload and parse a resume before running ATS scoring."],
        )
    data = load_ats_input_for_resume(db, user, resume_id)
    if not data:
        return AtsIntelligenceOut(
            analysis_ready=False,
            recommendations=["Upload and parse a resume before running ATS scoring."],
        )
    return compute_ats_intelligence(data)
