"""ATS dynamic role detection and role-specific skill libraries."""

from app.ats_service import AtsInput, compute_ats_intelligence
from app.ats_skill_intelligence import (
    match_resume_to_targets,
    resolve_ats_role,
    target_skills_for_role,
)


def test_frontend_resume_detected_from_header_not_generic_profile():
    skills = [
        "JavaScript",
        "TypeScript",
        "Angular",
        "HTML",
        "CSS",
        "Responsive Design",
        "Web Performance",
    ]
    role = resolve_ats_role(
        preferred_roles=["Software Engineer"],
        resume_skills=skills,
        resume_title="Frontend Developer",
        resume_header="Frontend Developer | React & Angular",
    )
    assert role.track == "frontend"
    assert role.display_role == "Frontend Developer"
    assert role.source == "resume_header"


def test_frontend_resume_detected_from_dominant_skills():
    skills = [
        "JavaScript",
        "TypeScript",
        "AngularJS",
        "HTML",
        "CSS",
        "Responsive Design",
        "Web Performance",
    ]
    role = resolve_ats_role(
        preferred_roles=[],
        resume_skills=skills,
        resume_title="John Doe",
        resume_header="John Doe",
    )
    assert role.track == "frontend"
    assert role.source == "dominant_skills"


def test_frontend_skill_match_high_not_1_of_24():
    skills = [
        "JavaScript",
        "TypeScript",
        "AngularJS",
        "HTML",
        "CSS",
        "Responsive Design",
        "Web Performance",
    ]
    targets = target_skills_for_role("frontend")
    result = match_resume_to_targets(skills, targets)
    assert result.target_count == 9
    assert result.match_count >= 6
    assert "JavaScript" in result.matched_targets or "Angular" in result.matched_targets


def test_ats_frontend_resume_end_to_end_score():
    data = AtsInput(
        resume_skills=[
            "JavaScript",
            "TypeScript",
            "AngularJS",
            "HTML",
            "CSS",
            "Responsive Design",
            "Web Performance",
        ],
        preferred_roles=["Software Engineer"],
        resume_title="Frontend Developer",
        resume_header="Frontend Developer",
        analysis_status="completed",
    )
    result = compute_ats_intelligence(data)
    assert result.detected_role == "Frontend Developer"
    assert result.target_skill_count == 9
    assert len(result.matched_skills) >= 6
    assert result.ats_score >= 45
    assert result.score_breakdown[0].score >= 65
    assert "Git" in result.missing_skills
    assert "React" not in result.missing_skills
    assert "Python" not in result.target_skill_set
    assert "Machine Learning" not in result.target_skill_set
    assert len(result.direct_matches) >= 5
