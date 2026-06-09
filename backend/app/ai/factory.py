from __future__ import annotations

from .providers.base import AIProvider
from .providers.mock import MockAIProvider

# Future: GeminiAIProvider, OpenAIProvider registered here when enabled.
_PROVIDER_REGISTRY: dict[str, type[AIProvider]] = {
    "mock": MockAIProvider,
}


def get_ai_provider(provider_name: str = "mock") -> AIProvider:
    """Return the configured AI provider implementation."""
    key = (provider_name or "mock").strip().lower()
    provider_cls = _PROVIDER_REGISTRY.get(key)
    if not provider_cls:
        raise ValueError(f"Unsupported AI provider: {provider_name}")
    return provider_cls()
