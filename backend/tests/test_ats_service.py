"""Unit tests for rule-based ATS intelligence (Phase 3.3)."""

from app.ats_service import AtsInput, compute_ats_intelligence


def test_ats_scores_complete_resume_high():
    data = AtsInput(
        resume_skills=[
            "Python",
            "JavaScript",
            "React",
            "FastAPI",
            "PostgreSQL",
            "Docker",
            "Git",
            "SQL",
            "REST",
            "Machine Learning",
            "LangChain",
        ],
        profile_skills=["Python", "React", "FastAPI"],
        preferred_roles=["AI Engineer"],
        analysis_status="completed",
    )
    data.experience = [
        type("Exp", (), {
            "role": "AI Engineer Intern",
            "duration": "Jan 2024 – Present",
            "description": "Built RAG pipeline serving 10k+ queries with 40% latency reduction.",
            "company": "Acme",
        })()
    ]
    data.projects = [
        type("Proj", (), {
            "project_name": "Career Bot",
            "description": "Full-stack app with measurable user growth.",
            "technologies": "Python, React, PostgreSQL, Docker",
        })(),
        type("Proj", (), {
            "project_name": "ML Pipeline",
            "description": "End-to-end training and deployment.",
            "technologies": "Python, TensorFlow, AWS",
        })(),
    ]
    data.education = [
        type("Edu", (), {"degree": "B.Tech CSE", "college": "State University"})(),
    ]
    data.certifications = [
        type("Cert", (), {"certification_name": "AWS Cloud Practitioner"})(),
        type("Cert", (), {"certification_name": "Google Data Analytics"})(),
    ]

    result = compute_ats_intelligence(data)
    assert 0 <= result.ats_score <= 100
    assert result.ats_score >= 55
    assert result.analysis_ready is True
    assert len(result.score_breakdown) == 6
    assert sum(b.weight for b in result.score_breakdown) == 100
    assert result.grade in ("Excellent", "Strong", "Good", "Fair", "Needs work")
    assert isinstance(result.strengths, list)
    assert isinstance(result.recommendations, list)


def test_ats_pending_analysis_low_completeness():
    data = AtsInput(
        resume_skills=["Python"],
        profile_skills=["Python", "JavaScript"],
        preferred_roles=["Software Engineer"],
        analysis_status="pending",
    )
    result = compute_ats_intelligence(data)
    assert result.analysis_ready is False
    assert any("parsing" in w.lower() or "missing" in w.lower() for w in result.weaknesses + result.recommendations)


def test_ats_missing_skills_from_target():
    data = AtsInput(
        resume_skills=["Python"],
        profile_skills=["Python", "React", "Docker", "Kubernetes"],
        preferred_roles=["Full Stack Developer"],
        analysis_status="completed",
    )
    result = compute_ats_intelligence(data)
    assert len(result.missing_skills) >= 1
    missing_lower = " ".join(result.missing_skills).lower()
    assert "react" in missing_lower or "docker" in missing_lower or "kubernetes" in missing_lower
    assert "python" not in missing_lower


def test_ats_alias_skills_not_listed_as_missing():
    data = AtsInput(
        resume_skills=["React.js", "Node.js", "Postgres", "ML", "GPT-4"],
        profile_skills=["React", "Node.js", "PostgreSQL", "Machine Learning", "GPT-4"],
        preferred_roles=["AI Engineer"],
        analysis_status="completed",
    )
    result = compute_ats_intelligence(data)
    assert result.detected_role
    assert "React" not in result.missing_skills
    assert "PostgreSQL" not in result.missing_skills
    assert "Machine Learning" not in result.missing_skills
    assert len(result.target_skill_set) <= 12
