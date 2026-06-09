from __future__ import annotations

import re
from typing import Dict, List

from .base import AIProvider, AIResumeOptimizationResult

ROLE_SKILL_LIBRARY: Dict[str, List[str]] = {
    "frontend developer": [
        "JavaScript",
        "TypeScript",
        "React",
        "HTML",
        "CSS",
        "Git",
        "Responsive Design",
    ],
    "backend developer": [
        "Node.js",
        "Express",
        "PostgreSQL",
        "REST APIs",
        "Docker",
        "AWS",
        "Git",
    ],
    "ai engineer": [
        "Python",
        "Machine Learning",
        "Deep Learning",
        "TensorFlow",
        "PyTorch",
        "LLMs",
        "LangChain",
    ],
    "full stack developer": [
        "JavaScript",
        "React",
        "Node.js",
        "PostgreSQL",
        "REST APIs",
        "Docker",
        "Git",
    ],
}

DEFAULT_SKILLS = [
    "Communication",
    "Problem Solving",
    "Git",
    "Agile",
    "REST APIs",
]

METRIC_PATTERN = re.compile(r"\d+\s*%|\d+\s*k\b|\d+\s*m\b|\d+\s+users", re.IGNORECASE)
SECTION_HEADERS = ("experience", "projects", "education", "skills", "summary")


class MockAIProvider(AIProvider):
    """Deterministic mock provider for local development and tests."""

    @property
    def provider_name(self) -> str:
        return "mock"

    def optimize_resume(self, resume_text: str, target_role: str) -> AIResumeOptimizationResult:
        role = (target_role or "Software Engineer").strip()
        role_key = role.lower()
        target_skills = ROLE_SKILL_LIBRARY.get(role_key, DEFAULT_SKILLS)

        text_lower = resume_text.lower()
        missing_skills = [skill for skill in target_skills if skill.lower() not in text_lower]

        improvements: List[str] = []
        if missing_skills:
            improvements.append(
                "Add missing role keywords to Skills and Experience: "
                + ", ".join(missing_skills[:5])
                + "."
            )

        if not METRIC_PATTERN.search(resume_text):
            improvements.append(
                "Quantify impact in experience bullets (%, users served, latency reduced)."
            )

        if not any(header in text_lower for header in SECTION_HEADERS):
            improvements.append(
                "Use standard section headers: Summary, Skills, Experience, Projects, Education."
            )
        elif "projects" not in text_lower:
            improvements.append("Add a Projects section with tech stack and measurable outcomes.")

        if len(resume_text.strip()) < 400:
            improvements.append("Expand resume content with stronger project and experience detail.")

        if not improvements:
            improvements.append(
                f"Resume aligns well with {role}. Keep keywords current and tailor bullets per job posting."
            )

        ats_gain = min(20, 4 + len(missing_skills) * 2 + (0 if METRIC_PATTERN.search(resume_text) else 3))
        summary = (
            f"Mock AI optimization for {role}: "
            f"{len(missing_skills)} skill gap(s) identified, "
            f"estimated ATS gain +{ats_gain} after applying recommendations."
        )

        return AIResumeOptimizationResult(
            summary=summary,
            missing_skills=missing_skills[:10],
            improvements=improvements[:6],
            ats_gain=ats_gain,
            target_role=role,
            provider=self.provider_name,
        )
