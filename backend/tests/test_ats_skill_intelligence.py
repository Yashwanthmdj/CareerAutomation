"""Tests for ATS skill normalization and alias matching (Phase 3.3.1)."""

from app.ats_skill_intelligence import (
    build_target_skill_set,
    match_resume_to_targets,
    resolve_ats_role,
    skill_to_canonical_key,
    skills_are_equivalent,
    target_skills_for_role,
)
from app.ats_service import AtsInput, compute_ats_intelligence


def test_alias_react_reactjs():
    assert skills_are_equivalent("React", "ReactJS")
    assert skills_are_equivalent("React.js", "React")


def test_alias_node_postgres_rest():
    assert skills_are_equivalent("Node", "Node.js")
    assert skills_are_equivalent("Postgres", "PostgreSQL")
    assert skills_are_equivalent("REST API", "REST APIs")
    assert skills_are_equivalent("Mongo", "MongoDB")


def test_alias_ai_ml_llm_gpt():
    assert skills_are_equivalent("AI", "Artificial Intelligence")
    assert skills_are_equivalent("ML", "Machine Learning")
    assert skills_are_equivalent("LLM", "LLMs")
    assert skills_are_equivalent("GPT-4", "GPT")
    assert skills_are_equivalent("JS", "JavaScript")
    assert skills_are_equivalent("TS", "TypeScript")


def test_match_does_not_flag_present_skills_as_missing():
    resume = ["ReactJS", "JS", "TypeScript", "Node.js", "PostgreSQL", "REST APIs", "GPT-4"]
    targets = build_target_skill_set(
        ["React", "JavaScript", "Node", "Postgres", "REST", "GPT", "Next.js"]
    )
    result = match_resume_to_targets(resume, targets)
    assert "React" not in result.missing_targets
    assert "JavaScript" not in result.missing_targets
    assert "PostgreSQL" not in result.missing_targets
    assert "Next.js" in result.missing_targets  # genuinely absent
    assert result.match_count >= 5


def test_genuinely_missing_only():
    resume = ["Python"]
    targets = build_target_skill_set(["Python", "React", "Docker", "Kubernetes"])
    result = match_resume_to_targets(resume, targets)
    missing_keys = {skill_to_canonical_key(s) for s in result.missing_targets}
    assert skill_to_canonical_key("Python") not in missing_keys
    assert "react" in missing_keys or skill_to_canonical_key("React") in missing_keys


def test_detect_frontend_track():
    role = resolve_ats_role(
        ["Frontend Developer"],
        ["React", "TypeScript", "CSS", "HTML"],
        resume_title="Frontend Developer",
    )
    assert role.track == "frontend"


def test_detect_ai_track():
    role = resolve_ats_role(
        ["AI Engineer"],
        ["Python", "Machine Learning", "LangChain", "LLMs"],
    )
    assert role.track == "ai"
    assert role.source == "preferred_role"


def test_target_library_only_nine_frontend_skills():
    targets = target_skills_for_role("frontend")
    assert len(targets) == 9


def test_ats_frontend_resume_aliases_not_missing():
    data = AtsInput(
        resume_skills=[
            "ReactJS",
            "TS",
            "HTML5",
            "CSS3",
            "Node",
            "Express.js",
            "Postgres",
            "REST API",
        ],
        profile_skills=["React", "TypeScript"],
        preferred_roles=["Frontend Developer"],
        analysis_status="completed",
    )
    result = compute_ats_intelligence(data)
    assert "React" not in result.missing_skills
    assert "TypeScript" not in result.missing_skills
    assert any("Frontend" in r or "React" in r for r in result.recommendations)
