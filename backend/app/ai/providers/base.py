from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List


@dataclass
class AIResumeOptimizationResult:
    """Provider-agnostic optimization result."""

    summary: str
    missing_skills: List[str] = field(default_factory=list)
    improvements: List[str] = field(default_factory=list)
    ats_gain: int = 0
    target_role: str = ""
    provider: str = ""


class AIProvider(ABC):
    """Abstract AI provider for resume optimization."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Stable provider identifier (e.g. mock, gemini)."""

    @abstractmethod
    def optimize_resume(self, resume_text: str, target_role: str) -> AIResumeOptimizationResult:
        """Generate resume optimization suggestions from raw resume text."""
