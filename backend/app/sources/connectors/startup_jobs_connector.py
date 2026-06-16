from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from ...opportunity_models import OpportunityType, SourceType
from ...opportunity_schemas import OpportunityCreate
from ..base_source import BaseSourceConnector, SourceHealthResult
from ..source_models import HealthStatus


class StartupJobsConnector(BaseSourceConnector):
    """Connector for startup job boards (Y Combinator Jobs, Wellfound)."""

    def __init__(
        self,
        *,
        source_id: str,
        source_name: str,
        source_type: SourceType,
        feed_url: str,
        board_slug: str,
    ) -> None:
        self.source_id = source_id
        self.source_name = source_name
        self._source_type = source_type
        self._feed_url = feed_url
        self._board_slug = board_slug

    async def fetch_opportunities(self) -> List[Dict[str, Any]]:
        deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        return [
            {
                "external_id": f"{self._board_slug}-fullstack",
                "title": f"Full Stack Engineer — {self.source_name}",
                "company": "Nebula Labs",
                "description": f"Mock startup job from {self.source_name} (Phase 4.1 safe mode).",
                "apply_link": f"{self._feed_url}/roles/{self._board_slug}-fullstack",
                "location": "Remote",
                "required_skills": ["React", "TypeScript", "Node.js"],
                "opportunity_type": OpportunityType.JOB.value,
                "deadline": deadline,
            },
            {
                "external_id": f"{self._board_slug}-founding-engineer",
                "title": f"Founding Engineer — {self.source_name}",
                "company": "Orbit AI",
                "description": f"Mock founding engineer listing from {self.source_name}.",
                "apply_link": f"{self._feed_url}/roles/{self._board_slug}-founding-engineer",
                "location": "San Francisco / Remote",
                "required_skills": ["Python", "LLMs", "Product Engineering"],
                "opportunity_type": OpportunityType.JOB.value,
                "deadline": deadline,
            },
        ]

    def normalize(self, raw: Dict[str, Any]) -> OpportunityCreate:
        deadline = raw.get("deadline")
        parsed_deadline = datetime.fromisoformat(deadline) if isinstance(deadline, str) else None
        return OpportunityCreate(
            title=raw["title"],
            company=raw["company"],
            source_type=self._source_type,
            source_name=self.source_name,
            description=raw.get("description"),
            apply_link=raw["apply_link"],
            location=raw.get("location"),
            required_skills=raw.get("required_skills", []),
            opportunity_type=OpportunityType(raw["opportunity_type"]),
            deadline=parsed_deadline,
        )

    async def health_check(self) -> SourceHealthResult:
        started = time.perf_counter()
        latency_ms = int((time.perf_counter() - started) * 1000) + 18
        if self._feed_url:
            return SourceHealthResult(
                status=HealthStatus.HEALTHY,
                message=f"{self.source_name} startup jobs feed is reachable (mock).",
                latency_ms=latency_ms,
            )
        return SourceHealthResult(
            status=HealthStatus.UNHEALTHY,
            message=f"{self.source_name} board URL is not configured.",
            latency_ms=latency_ms,
        )
