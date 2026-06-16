"""
Rule-based opportunity matching (Phase 3.6).

Connects resume skills, projects, ATS normalized skills, and opportunity requirements
into personalized match scores — no AI / embeddings.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Set

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .analysis_models import ExtractedProject, ExtractedSkill
from .ats_service import compute_ats_for_resume, load_ats_input_for_resume
from .ats_skill_intelligence import normalize_skill, skills_are_equivalent
from .models import User
from .opportunity_matching_schemas import (
    OpportunityMatchOut,
    OpportunityRecommendationListOut,
    OpportunityRecommendationOut,
)
from .opportunity_models import Opportunity
from .opportunity_service import OpportunityService
from .resume_service import get_active_resume

SKILLS_WEIGHT = 70
PROJECTS_WEIGHT = 20
ATS_WEIGHT = 10


@dataclass
class MatchInputs:
    resume_skills: List[str] = field(default_factory=list)
    ats_normalized_skills: List[str] = field(default_factory=list)
    projects: List[ExtractedProject] = field(default_factory=list)
    ats_readiness: int = 0
    analysis_ready: bool = False


def match_level_from_score(score: int) -> str:
    if score >= 90:
        return "EXCELLENT"
    if score >= 75:
        return "STRONG"
    if score >= 60:
        return "GOOD"
    if score >= 40:
        return "FAIR"
    return "LOW"


def _candidate_skill_pool(resume_skills: List[str], ats_normalized_skills: List[str]) -> List[str]:
    seen: Set[str] = set()
    pool: List[str] = []
    for skill in resume_skills + ats_normalized_skills:
        normalized = normalize_skill(skill)
        display = normalized or skill.strip()
        if not display:
            continue
        key = display.lower()
        if key in seen:
            continue
        seen.add(key)
        pool.append(display)
    return pool


def extract_matched_skills(
    resume_skills: List[str],
    ats_normalized_skills: List[str],
    required_skills: List[str],
) -> List[str]:
    """Required skills present in resume or ATS-normalized skill pool."""
    if not required_skills:
        return []

    pool = _candidate_skill_pool(resume_skills, ats_normalized_skills)
    if not pool:
        return []

    matched: List[str] = []
    for required in required_skills:
        if any(skills_are_equivalent(required, candidate) for candidate in pool):
            matched.append(required)
    return sorted(matched, key=str.lower)


def extract_missing_skills(required_skills: List[str], matched_skills: List[str]) -> List[str]:
    """Required skills not covered by matched_skills (alias-aware)."""
    if not required_skills:
        return []

    matched_set = set(matched_skills)
    missing: List[str] = []
    for required in required_skills:
        if any(skills_are_equivalent(required, matched) for matched in matched_set):
            continue
        missing.append(required)
    return sorted(missing, key=str.lower)


def _project_text(project: ExtractedProject) -> str:
    parts = [project.project_name or "", project.description or "", project.technologies or ""]
    return " ".join(parts).lower()


def _skill_in_projects(required: str, projects: List[ExtractedProject]) -> bool:
    for project in projects:
        blob = _project_text(project)
        if not blob:
            continue
        normalized_required = normalize_skill(required).lower()
        if normalized_required and normalized_required in blob:
            return True
        if required.lower() in blob:
            return True
        for token in (project.technologies or "").split(","):
            token = token.strip()
            if token and skills_are_equivalent(token, required):
                return True
    return False


def _skills_matched_in_projects(required_skills: List[str], projects: List[ExtractedProject]) -> int:
    if not required_skills or not projects:
        return 0
    return sum(1 for required in required_skills if _skill_in_projects(required, projects))


def calculate_match_score(
    resume_skills: List[str],
    ats_normalized_skills: List[str],
    projects: List[ExtractedProject],
    required_skills: List[str],
    ats_readiness: int,
) -> int:
    """
    Weighted match score (0–100):
    - Skills match: 70%
    - Projects match: 20%
    - ATS readiness: 10%
    """
    ats_component = max(0, min(100, ats_readiness)) * ATS_WEIGHT / 100

    if not required_skills:
        skills_component = float(SKILLS_WEIGHT)
        projects_component = float(PROJECTS_WEIGHT)
    else:
        matched = extract_matched_skills(resume_skills, ats_normalized_skills, required_skills)
        skills_ratio = len(matched) / len(required_skills)
        skills_component = skills_ratio * SKILLS_WEIGHT

        project_hits = _skills_matched_in_projects(required_skills, projects)
        projects_ratio = project_hits / len(required_skills)
        projects_component = projects_ratio * PROJECTS_WEIGHT

    total = skills_component + projects_component + ats_component
    return int(round(max(0, min(100, total))))


def build_match_analysis(
    opportunity_id: str,
    required_skills: List[str],
    inputs: MatchInputs,
) -> OpportunityMatchOut:
    matched = extract_matched_skills(
        inputs.resume_skills,
        inputs.ats_normalized_skills,
        required_skills,
    )
    missing = extract_missing_skills(required_skills, matched)
    score = calculate_match_score(
        inputs.resume_skills,
        inputs.ats_normalized_skills,
        inputs.projects,
        required_skills,
        inputs.ats_readiness,
    )
    return OpportunityMatchOut(
        opportunity_id=opportunity_id,
        match_score=score,
        match_level=match_level_from_score(score),
        matched_skills=matched,
        missing_skills=missing,
        analysis_ready=inputs.analysis_ready,
    )


def load_match_inputs(db: Session, user: User) -> tuple[Optional[str], MatchInputs]:
    active = get_active_resume(db, user.id)
    if not active:
        return None, MatchInputs(analysis_ready=False)

    resume_skills = [
        row.skill for row in db.query(ExtractedSkill).filter(ExtractedSkill.resume_id == active.id).all()
    ]
    projects = db.query(ExtractedProject).filter(ExtractedProject.resume_id == active.id).all()

    ats_data = load_ats_input_for_resume(db, user, active.id)
    ats_normalized: List[str] = []
    ats_readiness = 0
    analysis_ready = bool(ats_data and ats_data.analysis_status == "completed")

    if ats_data:
        ats_result = compute_ats_for_resume(db, user, active.id)
        if ats_result.analysis_ready:
            analysis_ready = True
            ats_readiness = ats_result.ats_score
            ats_normalized = [item.normalized for item in ats_result.resume_skills_normalized if item.normalized]
            ats_normalized.extend(ats_result.matched_skills)

    if resume_skills or projects:
        analysis_ready = True

    return active.id, MatchInputs(
        resume_skills=resume_skills,
        ats_normalized_skills=ats_normalized,
        projects=projects,
        ats_readiness=ats_readiness,
        analysis_ready=analysis_ready,
    )


class OpportunityMatchingService:
    def __init__(self, db: Session):
        self.db = db
        self._opportunity_service = OpportunityService(db)

    def get_match_for_opportunity(self, user: User, opportunity_id: str) -> OpportunityMatchOut:
        opportunity = self.db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
        if not opportunity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")

        resume_id, inputs = load_match_inputs(self.db, user)
        if not resume_id:
            return OpportunityMatchOut(
                opportunity_id=opportunity_id,
                match_score=0,
                match_level="LOW",
                matched_skills=[],
                missing_skills=sorted(opportunity.required_skills or [], key=str.lower),
                analysis_ready=False,
                message="Upload and analyze an active resume to compute match scores.",
            )

        return build_match_analysis(
            opportunity_id,
            opportunity.required_skills or [],
            inputs,
        )

    def get_opportunity_recommendations(
        self,
        user: User,
        *,
        min_score: int = 0,
        limit: Optional[int] = None,
    ) -> OpportunityRecommendationListOut:
        resume_id, inputs = load_match_inputs(self.db, user)
        if not resume_id:
            return OpportunityRecommendationListOut(
                recommendations=[],
                total=0,
                analysis_ready=False,
                message="Upload and analyze an active resume to receive recommendations.",
            )

        saved_ids = self._opportunity_service._saved_ids_for_user(user.id)
        opportunities = self.db.query(Opportunity).order_by(Opportunity.created_at.desc()).all()

        ranked: List[OpportunityRecommendationOut] = []
        for opportunity in opportunities:
            required = opportunity.required_skills or []
            analysis = build_match_analysis(opportunity.id, required, inputs)
            if analysis.match_score < min_score:
                continue
            ranked.append(
                OpportunityRecommendationOut(
                    opportunity=self._opportunity_service._to_out(opportunity, saved_ids),
                    match_score=analysis.match_score,
                    match_level=analysis.match_level,
                    matched_skills=analysis.matched_skills,
                    missing_skills=analysis.missing_skills,
                )
            )

        ranked.sort(key=lambda item: (-item.match_score, item.opportunity.title.lower()))
        total = len(ranked)
        if limit is not None:
            ranked = ranked[:limit]

        return OpportunityRecommendationListOut(
            recommendations=ranked,
            total=total,
            analysis_ready=inputs.analysis_ready,
            resume_id=resume_id,
        )


def get_opportunity_recommendations(
    db: Session,
    user: User,
    *,
    min_score: int = 0,
    limit: Optional[int] = None,
) -> OpportunityRecommendationListOut:
    """Rank opportunities by match score for the user's active resume."""
    return OpportunityMatchingService(db).get_opportunity_recommendations(
        user,
        min_score=min_score,
        limit=limit,
    )
