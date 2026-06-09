"""AI provider layer for resume optimization (Phase 3.5)."""

from .providers.base import AIProvider, AIResumeOptimizationResult
from .providers.mock import MockAIProvider
from .schemas import OptimizationRequest, OptimizationResponse

__all__ = [
    "AIProvider",
    "AIResumeOptimizationResult",
    "MockAIProvider",
    "OptimizationRequest",
    "OptimizationResponse",
]
