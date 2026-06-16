from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from ..opportunity_schemas import OpportunityCreate


class BaseScout(ABC):
    """Abstract adapter for external opportunity sources."""

    source_name: str

    @abstractmethod
    async def discover(self) -> List[OpportunityCreate]:
        """Return normalized opportunity payloads ready for ingestion."""
