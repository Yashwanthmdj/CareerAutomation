from app.resume_optimizer import OptimizerInput, compute_resume_optimization


def _obj(**kwargs):
    return type("Obj", (), kwargs)()


def test_optimizer_generates_high_priority_skill_and_headline_items():
    inp = OptimizerInput(
        resume_id="r1",
        resume_title="Resume",
        raw_text="Resume\nJohn Doe",
        experiences=[],
        projects=[],
        certifications=[],
    )
    out = compute_resume_optimization(inp, ["React", "TypeScript", "Git"])

    assert 0 <= out.health_score <= 100
    assert out.estimated_ats_gain > 0
    assert any(item.priority == "High" for item in out.optimization_items)
    assert any("headline" in item.title.lower() for item in out.optimization_items)
    assert "React" in out.keyword_gaps


def test_optimizer_experience_metrics_rule():
    experiences = [
        _obj(description="Built feature and improved quality."),
        _obj(description="Worked on APIs and maintenance."),
    ]
    inp = OptimizerInput(
        resume_id="r2",
        resume_title="Frontend Developer",
        raw_text="Frontend Developer\nSummary line",
        experiences=experiences,
        projects=[],
        certifications=[],
    )
    out = compute_resume_optimization(inp, [])
    assert any("number" in item.recommendation.lower() for item in out.optimization_items)


def test_optimizer_projects_short_description_rule():
    projects = [
        _obj(description="Todo app", technologies="React"),
        _obj(description="Portfolio", technologies="HTML,CSS"),
    ]
    inp = OptimizerInput(
        resume_id="r3",
        resume_title="Full Stack Developer",
        raw_text="Full Stack Developer",
        experiences=[_obj(description="Increased performance by 20% for 10k users")],
        projects=projects,
        certifications=[_obj(certification_name="AWS CCP")],
    )
    out = compute_resume_optimization(inp, [])
    assert any("project" in item.title.lower() for item in out.optimization_items)


def test_optimizer_output_contains_section_scores():
    inp = OptimizerInput(
        resume_id="r4",
        resume_title="AI Engineer",
        raw_text="AI Engineer",
        experiences=[_obj(description="Reduced latency by 35% across 2 pipelines")],
        projects=[_obj(description="Built ML platform with 3 modules and 15% gain", technologies="Python")],
        certifications=[_obj(certification_name="TensorFlow Developer")],
    )
    out = compute_resume_optimization(inp, ["LangChain"])
    assert "headline" in out.section_scores
    assert "skills_alignment" in out.section_scores
    assert out.impact_summary
