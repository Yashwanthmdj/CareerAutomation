"""Unit tests for normalize_skill() — Phase 3.3 ATS skill normalization."""

import pytest

from app.ats_skill_intelligence import (
    match_resume_to_targets,
    normalize_skill,
    skills_are_equivalent,
    target_skills_for_role,
)


@pytest.mark.parametrize(
    "left,right,expected",
    [
        ("GPT4", "GPT-4", "GPT-4"),
        ("OpenAI GPT-4", "gpt4", "GPT-4"),
        ("ML", "Machine Learning", "Machine Learning"),
        ("machine learning", "ML", "Machine Learning"),
        ("REST API", "REST APIs", "REST"),
        ("RESTful APIs", "REST", "REST"),
        ("Node", "Node.js", "Node.js"),
        ("nodejs", "Node", "Node.js"),
        ("Java Script", "JavaScript", "JavaScript"),
        ("java script", "JS", "JavaScript"),
    ],
)
def test_normalize_skill_alias_pairs(left: str, right: str, expected: str) -> None:
    assert normalize_skill(left) == expected
    assert normalize_skill(right) == expected
    assert skills_are_equivalent(left, right)


def test_normalize_skill_lowercase_trim_strip_punctuation() -> None:
    assert normalize_skill("  JavaScript!!!  ") == "JavaScript"
    assert normalize_skill("C++") == "C++" or normalize_skill("C++").lower() == "c++"


def test_matching_uses_normalization_on_both_sides() -> None:
    resume = ["GPT4", "ML", "REST API", "Node", "Java Script"]
    targets = {"GPT-4", "Machine Learning", "REST", "Node.js", "JavaScript", "Python"}
    result = match_resume_to_targets(resume, targets)
    assert result.match_count >= 5
    assert skills_are_equivalent("GPT4", "GPT-4")
    assert "Machine Learning" in result.matched_targets


def test_match_result_includes_raw_and_normalized() -> None:
    resume = ["GPT4", "ML"]
    targets = {"GPT-4", "Machine Learning", "Python"}
    result = match_resume_to_targets(resume, targets)
    resume_map = {e.raw: e.normalized for e in result.resume_normalizations}
    assert resume_map["GPT4"] == "GPT-4"
    assert resume_map["ML"] == "Machine Learning"
    target_map = {e.raw: e.normalized for e in result.target_normalizations}
    assert target_map["GPT-4"] == "GPT-4"
