"""Parser robustness tests for frontend-style resume layouts."""

from pathlib import Path

from app.resume_parser import parse_resume_text

FRONTEND_FIXTURE = Path(__file__).parent / "fixtures" / "frontend_developer_resume.txt"


def test_frontend_resume_sections_detected():
    text = FRONTEND_FIXTURE.read_text(encoding="utf-8")
    parsed = parse_resume_text(text)

    assert "skills" in parsed.diagnostics.detected_sections
    assert "experience" in parsed.diagnostics.detected_sections
    assert "education" in parsed.diagnostics.detected_sections


def test_frontend_resume_skills_extracted():
    text = FRONTEND_FIXTURE.read_text(encoding="utf-8")
    parsed = parse_resume_text(text)
    skills_lower = {s.lower() for s in parsed.skills}

    for expected in (
        "javascript",
        "typescript",
        "react",
        "angular",
        "vue",
        "node.js",
        "html",
        "css",
        "bootstrap",
        "mongodb",
        "postgresql",
        "aws",
        "docker",
        "git",
    ):
        assert expected in skills_lower or any(expected in s for s in skills_lower), (
            f"Missing skill: {expected}; got {parsed.skills}"
        )

    assert len(parsed.skills) >= 15, f"Expected >= 15 skills, got {len(parsed.skills)}: {parsed.skills}"


def test_frontend_resume_experience_blocks():
    text = FRONTEND_FIXTURE.read_text(encoding="utf-8")
    parsed = parse_resume_text(text)

    assert len(parsed.experience) >= 2, (
        f"Expected >= 2 jobs, got {len(parsed.experience)}: "
        f"{[(e.role, e.company, e.duration) for e in parsed.experience]}"
    )
    roles = " ".join((e.role or "").lower() for e in parsed.experience)
    assert "frontend" in roles or "developer" in roles


def test_frontend_resume_diagnostics():
    text = FRONTEND_FIXTURE.read_text(encoding="utf-8")
    parsed = parse_resume_text(text)
    d = parsed.diagnostics

    assert d.raw_text_length > 200
    assert d.extraction_counts["skills"] >= 15
    assert d.extraction_counts["experience"] >= 2
    assert d.extraction_counts["education"] >= 1
    assert 0.0 <= d.parser_confidence <= 1.0
