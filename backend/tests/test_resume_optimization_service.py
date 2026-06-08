from __future__ import annotations

from app.ats_schemas import AtsIntelligenceOut, ScoreBreakdownItem
from app.resume_optimization_service import OptimizationInput, compute_resume_optimization


def _obj(**kwargs):
    defaults = {
        "role": None,
        "duration": None,
        "description": None,
        "company": None,
        "degree": None,
        "college": None,
        "technologies": None,
        "certification_name": None,
    }
    defaults.update(kwargs)
    return type("Obj", (), defaults)()


def _ats(
    *,
    score: int = 50,
    missing: list[str] | None = None,
    matched: list[str] | None = None,
    target_count: int = 10,
    role: str = "Frontend Developer",
    strengths: list[str] | None = None,
    weaknesses: list[str] | None = None,
) -> AtsIntelligenceOut:
    missing = missing or []
    matched = matched or ["JavaScript", "HTML"]
    return AtsIntelligenceOut(
        ats_score=score,
        detected_role=role,
        target_role=role,
        missing_skills=missing,
        matched_skills=matched,
        target_skill_count=target_count,
        resume_skill_count=len(matched),
        strengths=strengths or ["Clear role title"],
        weaknesses=weaknesses or [],
        score_breakdown=[
            ScoreBreakdownItem(
                category="skills_match",
                label="Skills alignment",
                score=72,
                weight=35,
                detail="",
            ),
            ScoreBreakdownItem(
                category="completeness",
                label="Resume completeness",
                score=80,
                weight=10,
                detail="",
            ),
        ],
        analysis_ready=True,
    )


def test_optimization_response_shape():
    inp = OptimizationInput(
        resume_id="r1",
        resume_title="Frontend Developer",
        raw_text="Frontend Developer\nSUMMARY\nBuilt responsive web apps.",
        resume_skills=["JavaScript", "React", "HTML", "CSS"],
        experiences=[_obj(description="Improved load time by 35% for 10k users", role="Frontend Dev")],
        projects=[_obj(description="Built portfolio with React and TypeScript across 3 modules", technologies="React,TS")],
        education=[_obj(degree="B.Tech", college="State University")],
        certifications=[],
        analysis_status="completed",
        ats=_ats(missing=["TypeScript", "Git"]),
    )
    out = compute_resume_optimization(inp)

    assert 0 <= out.health_score <= 100
    assert out.ats_readiness == 50
    assert out.keyword_coverage == 20
    assert 0 <= out.recruiter_readability <= 100
    assert out.section_scores.summary >= 0
    assert out.section_scores.skills == 72
    assert out.section_scores.experience >= 0
    assert out.section_scores.education >= 0
    assert out.section_scores.projects >= 0
    assert isinstance(out.strengths, list)
    assert isinstance(out.improvements, list)
    assert out.ats_simulator.current_score == 50
    assert out.ats_simulator.projected_score >= out.ats_simulator.current_score
    assert len(out.ats_simulator.actions) <= 3


def test_optimization_generates_skill_gap_action():
    inp = OptimizationInput(
        resume_id="r2",
        resume_title="Resume",
        raw_text="Resume\nJohn Doe",
        resume_skills=["HTML"],
        experiences=[],
        projects=[],
        education=[],
        ats=_ats(missing=["React", "TypeScript", "Git", "CSS"], matched=["HTML"], target_count=9),
    )
    out = compute_resume_optimization(inp)

    assert any("skill" in a.title.lower() for a in out.ats_simulator.actions)
    assert any("keyword" in imp.lower() or "skill" in imp.lower() for imp in out.improvements)
    assert out.ats_simulator.projected_score > out.ats_simulator.current_score


def test_optimization_weak_headline_improvement():
    inp = OptimizationInput(
        resume_id="r3",
        resume_title="Resume",
        raw_text="Resume\nJohn Doe",
        resume_skills=["Python"],
        experiences=[_obj(description="Worked on APIs")],
        projects=[_obj(description="App", technologies="Python")],
        education=[],
        ats=_ats(role="AI Engineer"),
    )
    out = compute_resume_optimization(inp)

    assert any("headline" in imp.lower() or "summary" in imp.lower() for imp in out.improvements)
    assert any("headline" in a.title.lower() or "summary" in a.title.lower() for a in out.ats_simulator.actions)


def test_optimization_strengths_from_positive_signals():
    inp = OptimizationInput(
        resume_id="r4",
        resume_title="AI Engineer",
        raw_text="AI Engineer\nSUMMARY\nML engineer with 5 years experience building production models.",
        resume_skills=["Python", "TensorFlow", "PyTorch", "Machine Learning"],
        experiences=[
            _obj(description="Reduced latency by 40% serving 2M users", role="ML Engineer"),
            _obj(description="Cut training time by 25% across 3 pipelines", role="Data Scientist"),
        ],
        projects=[
            _obj(description="Built end-to-end ML platform with monitoring and 15% accuracy gain", technologies="Python,TF"),
            _obj(description="Deployed NLP pipeline handling 50k requests daily with 99.9% uptime", technologies="PyTorch"),
        ],
        education=[_obj(degree="M.S. CS", college="Tech Institute")],
        ats=_ats(
            score=78,
            matched=["Python", "TensorFlow", "PyTorch", "Machine Learning"],
            target_count=9,
            role="AI Engineer",
            strengths=["Strong AI Engineer skill coverage"],
        ),
    )
    out = compute_resume_optimization(inp)

    assert len(out.strengths) >= 2
    assert out.recruiter_readability >= 60
    assert out.health_score >= 55
