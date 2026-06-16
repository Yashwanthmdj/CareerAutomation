from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from ..opportunity_schemas import OpportunityCreate


class BaseConnector(ABC):
    """Source connector contract for Opportunity Scout (Phase 4.0)."""

    source_name: str

    @abstractmethod
    async def collect(self) -> List[OpportunityCreate]:
        """Collect and normalize opportunities from a source."""
