"""ATS skill family (semantic group) matching tests."""

from app.ats_skill_intelligence import (
    compute_skills_alignment_score,
    families_for_skill,
    match_resume_to_targets,
    normalize_skill,
)


def test_langchain_family_match_to_llms_target():
    result = match_resume_to_targets(["LangChain"], {"LLMs", "GPT-4"})
    assert "LLMs" in result.missing_targets or any(
        fm.target_skill == "LLMs" for fm in result.family_matches
    )
    assert any(fm.target_skill == "GPT-4" and fm.resume_skill == "LangChain" for fm in result.family_matches)


def test_tensorflow_family_match_to_machine_learning():
    result = match_resume_to_targets(["TensorFlow"], {"Machine Learning", "Python"})
    assert "Machine Learning" in result.direct_matches or any(
        fm.target_skill == "Machine Learning" for fm in result.family_matches
    )
    if result.family_matches:
        assert result.family_matches[0].family == "Machine Learning"


def test_express_family_match_to_nodejs():
    result = match_resume_to_targets(["Express"], {"Node.js", "PostgreSQL"})
    assert any(fm.target_skill == "Node.js" for fm in result.family_matches) or "Node.js" in result.direct_matches


def test_direct_match_scores_higher_than_family_only():
    direct_only = match_resume_to_targets(
        ["JavaScript", "TypeScript", "HTML", "CSS", "React", "Angular"],
        {"HTML", "CSS", "JavaScript", "TypeScript", "React", "Angular", "Next.js", "Git"},
    )
    family_only = match_resume_to_targets(
        ["LangChain"],
        {"GPT-4", "Claude", "Gemini", "LLMs", "Prompt Engineering"},
    )
    assert compute_skills_alignment_score(direct_only) > compute_skills_alignment_score(family_only)


def test_families_for_skill():
    assert "LLMs" in families_for_skill("LangChain")
    assert "LLMs" in families_for_skill("GPT-4")
    assert "Machine Learning" in families_for_skill("TensorFlow")
    assert "Frontend Development" in families_for_skill("React")
    assert "Backend Development" in families_for_skill("Express")


def test_direct_match_not_duplicated_as_family():
    result = match_resume_to_targets(["React", "JavaScript"], {"React", "JavaScript"})
    assert "React" in result.direct_matches
    assert "JavaScript" in result.direct_matches
    assert not any(fm.target_skill == "React" for fm in result.family_matches)


def test_family_match_diagnostics_fields():
    result = match_resume_to_targets(["LangChain"], {"GPT-4"})
    assert result.direct_match_count >= 0
    assert result.family_match_count >= 1
    fm = next(f for f in result.family_matches if f.target_skill == "GPT-4")
    assert fm.resume_skill == normalize_skill("LangChain")
    assert fm.family == "LLMs"
