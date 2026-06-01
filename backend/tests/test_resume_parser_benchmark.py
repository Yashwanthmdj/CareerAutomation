"""
Benchmark test for resume parser accuracy (Phase 3.2.1).

Uses tests/fixtures/benchmark_resume.pdf (Maddoju Yashwanth benchmark resume).
Pass criteria:
  - Skills >= 20
  - Projects == 3
  - Experience == 1
  - Education == 2
  - Certifications >= 5
"""

from __future__ import annotations

from pathlib import Path

import pytest

from app.resume_parser import parse_resume

FIXTURE_PDF = Path(__file__).parent / "fixtures" / "benchmark_resume.pdf"


@pytest.mark.skipif(not FIXTURE_PDF.exists(), reason="benchmark_resume.pdf fixture missing")
def test_benchmark_resume_extraction_counts():
    pdf_bytes = FIXTURE_PDF.read_bytes()
    parsed = parse_resume(pdf_bytes)

    skills_count = len(parsed.skills)
    projects_count = len(parsed.projects)
    experience_count = len(parsed.experience)
    education_count = len(parsed.education)
    certifications_count = len(parsed.certifications)

    assert skills_count >= 20, f"Expected >= 20 skills, got {skills_count}: {parsed.skills}"
    assert projects_count == 3, f"Expected 3 projects, got {projects_count}: {[p.project_name for p in parsed.projects]}"
    assert experience_count == 1, (
        f"Expected 1 experience, got {experience_count}: "
        f"{[(e.role, e.duration) for e in parsed.experience]}"
    )
    assert education_count == 2, (
        f"Expected 2 education entries, got {education_count}: "
        f"{[(e.degree, e.college) for e in parsed.education]}"
    )
    assert certifications_count >= 5, (
        f"Expected >= 5 certifications, got {certifications_count}: "
        f"{[c.certification_name for c in parsed.certifications]}"
    )


@pytest.mark.skipif(not FIXTURE_PDF.exists(), reason="benchmark_resume.pdf fixture missing")
def test_benchmark_sections_detected():
    pdf_bytes = FIXTURE_PDF.read_bytes()
    parsed = parse_resume(pdf_bytes)

    assert parsed.sections_found.get("skills"), "Technical Skills section not detected"
    assert parsed.sections_found.get("experience"), "Experience section not detected"
    assert parsed.sections_found.get("projects"), "Projects section not detected"
    assert parsed.sections_found.get("certifications"), "Awards & Certifications not detected"
    assert parsed.sections_found.get("education"), "Education section not detected"


@pytest.mark.skipif(not FIXTURE_PDF.exists(), reason="benchmark_resume.pdf fixture missing")
def test_benchmark_expected_certification_keywords():
    pdf_bytes = FIXTURE_PDF.read_bytes()
    parsed = parse_resume(pdf_bytes)
    names = " ".join(c.certification_name.lower() for c in parsed.certifications)

    for keyword in [
        "national ai autonomous hackathon",
        "cbit hackathon",
        "student board",
        "salesforce",
        "aws solutions architecture",
        "ai engineer certification",
    ]:
        assert keyword in names, f"Missing certification keyword: {keyword}"


@pytest.mark.skipif(not FIXTURE_PDF.exists(), reason="benchmark_resume.pdf fixture missing")
def test_benchmark_expected_education_degrees():
    pdf_bytes = FIXTURE_PDF.read_bytes()
    parsed = parse_resume(pdf_bytes)
    degrees = " ".join((e.degree or "").lower() for e in parsed.education)

    assert "b.tech" in degrees or "btech" in degrees.replace(".", "")
    assert "intermediate" in degrees
