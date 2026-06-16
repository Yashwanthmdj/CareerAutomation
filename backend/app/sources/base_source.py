from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from ..opportunity_schemas import OpportunityCreate
from .source_models import HealthStatus


@dataclass
class SourceHealthResult:
    status: HealthStatus
    message: str
    latency_ms: Optional[int] = None


class BaseSourceConnector(ABC):
    """Pluggable opportunity source connector (Phase 4.1)."""

    source_id: str
    source_name: str

    @abstractmethod
    async def fetch_opportunities(self) -> List[Dict[str, Any]]:
        """Fetch raw opportunity records from the source (no scraping in safe mode)."""

    @abstractmethod
    def normalize(self, raw: Dict[str, Any]) -> OpportunityCreate:
        """Normalize a raw record into the common ingestion schema."""

    @abstractmethod
    async def health_check(self) -> SourceHealthResult:
        """Verify source availability and connector readiness."""

    async def collect(self) -> List[OpportunityCreate]:
        raw_items = await self.fetch_opportunities()
        return [self.normalize(item) for item in raw_items]
