from __future__ import annotations

from datetime import datetime, timezone

from app.analysis_models import ExtractedProject
from app.opportunity_matching_service import (
    MatchInputs,
    build_match_analysis,
    calculate_match_score,
    extract_matched_skills,
    extract_missing_skills,
    match_level_from_score,
)
from app.opportunity_matching_service import OpportunityMatchingService
from app.opportunity_models import Opportunity, OpportunityType, SourceType


def _project(name: str, technologies: str = "", description: str = "") -> ExtractedProject:
    return ExtractedProject(
        id="proj-1",
        user_id="user-1",
        resume_id="resume-1",
        project_name=name,
        description=description,
        technologies=technologies,
        created_at=datetime.now(timezone.utc),
    )


def test_extract_matched_and_missing_skills():
    resume_skills = ["Python", "FastAPI", "React"]
    ats_skills = ["Machine Learning"]
    required = ["Python", "TensorFlow", "Machine Learning", "Docker"]

    matched = extract_matched_skills(resume_skills, ats_skills, required)
    assert "Python" in matched
    assert "Machine Learning" in matched
    assert "TensorFlow" not in matched

    missing = extract_missing_skills(required, matched)
    assert "TensorFlow" in missing
    assert "Docker" in missing
    assert "Python" not in missing


def test_calculate_match_score_weights():
    resume_skills = ["Python", "FastAPI", "Machine Learning"]
    ats_skills = []
    required = ["Python", "Machine Learning", "TensorFlow", "Docker"]
    projects = [
        _project("ML API", technologies="Python, FastAPI, Machine Learning"),
    ]

    matched = extract_matched_skills(resume_skills, ats_skills, required)
    skills_ratio = len(matched) / len(required)
    projects_ratio = 2 / len(required)  # Python + Machine Learning in project tech
    expected = round(skills_ratio * 70 + projects_ratio * 20 + 0.82 * 10)

    score = calculate_match_score(resume_skills, ats_skills, projects, required, ats_readiness=82)
    assert score == expected
    assert 0 <= score <= 100


def test_match_level_thresholds():
    assert match_level_from_score(95) == "EXCELLENT"
    assert match_level_from_score(82) == "STRONG"
    assert match_level_from_score(65) == "GOOD"
    assert match_level_from_score(50) == "FAIR"
    assert match_level_from_score(20) == "LOW"


def test_build_match_analysis_example_shape():
    inputs = MatchInputs(
        resume_skills=["Python", "FastAPI", "Machine Learning"],
        ats_normalized_skills=["Machine Learning"],
        projects=[_project("Nexus API", technologies="Python, FastAPI")],
        ats_readiness=82,
        analysis_ready=True,
    )
    analysis = build_match_analysis(
        "opp-1",
        ["Python", "Machine Learning", "FastAPI", "TensorFlow", "Docker"],
        inputs,
    )
    assert analysis.opportunity_id == "opp-1"
    assert analysis.match_level in {"GOOD", "FAIR"}
    assert "Python" in analysis.matched_skills
    assert "FastAPI" in analysis.matched_skills
    assert "TensorFlow" in analysis.missing_skills
    assert "Docker" in analysis.missing_skills
    assert 40 <= analysis.match_score <= 74


class FakeOpportunityQuery:
    def __init__(self, opportunities):
        self._opportunities = opportunities

    def order_by(self, *_args, **_kwargs):
        return self

    def all(self):
        return self._opportunities


class FakeDB:
    def __init__(self, opportunities):
        self._opportunities = opportunities

    def query(self, model):
        if getattr(model, "__name__", "") == "Opportunity":
            return FakeOpportunityQuery(self._opportunities)
        raise AssertionError(f"Unexpected query model: {model}")


def test_recommendation_ranking_and_sort_order(monkeypatch):
    now = datetime.now(timezone.utc)
    low_opp = Opportunity(
        id="opp-low",
        title="Junior Role",
        company="Acme",
        source_name="Manual",
        source_type=SourceType.MANUAL.value,
        required_skills=["Java", "Spring"],
        opportunity_type=OpportunityType.JOB.value,
        created_at=now,
        updated_at=now,
    )
    high_opp = Opportunity(
        id="opp-high",
        title="Python ML Intern",
        company="Nexus",
        source_name="Manual",
        source_type=SourceType.MANUAL.value,
        required_skills=["Python", "Machine Learning", "FastAPI"],
        opportunity_type=OpportunityType.INTERNSHIP.value,
        created_at=now,
        updated_at=now,
    )

    inputs = MatchInputs(
        resume_skills=["Python", "FastAPI", "Machine Learning"],
        ats_normalized_skills=["Machine Learning"],
        projects=[_project("ML Service", technologies="Python, FastAPI")],
        ats_readiness=80,
        analysis_ready=True,
    )

    monkeypatch.setattr(
        "app.opportunity_matching_service.load_match_inputs",
        lambda _db, _user: ("resume-1", inputs),
    )

    service = OpportunityMatchingService(FakeDB([low_opp, high_opp]))
    service._opportunity_service._saved_ids_for_user = lambda _user_id: set()

    result = service.get_opportunity_recommendations(type("U", (), {"id": "user-1"})())
    assert len(result.recommendations) == 2
    assert result.recommendations[0].opportunity.id == "opp-high"
    assert result.recommendations[1].opportunity.id == "opp-low"
    assert result.recommendations[0].match_score >= result.recommendations[1].match_score


def test_recommendation_min_score_filter(monkeypatch):
    now = datetime.now(timezone.utc)
    opp = Opportunity(
        id="opp-1",
        title="Java Role",
        company="Acme",
        source_name="Manual",
        source_type=SourceType.MANUAL.value,
        required_skills=["Java", "Spring", "Kafka"],
        opportunity_type=OpportunityType.JOB.value,
        created_at=now,
        updated_at=now,
    )
    inputs = MatchInputs(
        resume_skills=["Python"],
        ats_normalized_skills=[],
        projects=[],
        ats_readiness=50,
        analysis_ready=True,
    )
    monkeypatch.setattr(
        "app.opportunity_matching_service.load_match_inputs",
        lambda _db, _user: ("resume-1", inputs),
    )
    service = OpportunityMatchingService(FakeDB([opp]))
    service._opportunity_service._saved_ids_for_user = lambda _user_id: set()

    all_results = service.get_opportunity_recommendations(type("U", (), {"id": "user-1"})())
    filtered = service.get_opportunity_recommendations(
        type("U", (), {"id": "user-1"})(),
        min_score=60,
    )
    assert len(all_results.recommendations) == 1
    assert len(filtered.recommendations) == 0
