from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from ...opportunity_models import OpportunityType, SourceType
from ...opportunity_schemas import OpportunityCreate
from ..base_source import BaseSourceConnector, SourceHealthResult
from ..source_models import HealthStatus


class CommunityConnector(BaseSourceConnector):
    """Connector for community opportunity channels (Student Tribe, T-Hub)."""

    def __init__(
        self,
        *,
        source_id: str,
        source_name: str,
        source_type: SourceType,
        feed_url: str,
        community_slug: str,
    ) -> None:
        self.source_id = source_id
        self.source_name = source_name
        self._source_type = source_type
        self._feed_url = feed_url
        self._community_slug = community_slug

    async def fetch_opportunities(self) -> List[Dict[str, Any]]:
        deadline = (datetime.now(timezone.utc) + timedelta(days=21)).isoformat()
        return [
            {
                "external_id": f"{self._community_slug}-fellowship",
                "title": f"Innovation Fellowship — {self.source_name}",
                "company": "Community Partners",
                "description": f"Mock community fellowship from {self.source_name} (Phase 4.1 safe mode).",
                "apply_link": f"{self._feed_url}/opportunities/{self._community_slug}-fellowship",
                "location": "Hybrid",
                "required_skills": ["Leadership", "Communication", "Innovation"],
                "opportunity_type": OpportunityType.INTERNSHIP.value,
                "deadline": deadline,
            },
            {
                "external_id": f"{self._community_slug}-hackathon",
                "title": f"Buildathon — {self.source_name}",
                "company": "Ecosystem Collective",
                "description": f"Mock community hackathon listing from {self.source_name}.",
                "apply_link": f"{self._feed_url}/opportunities/{self._community_slug}-hackathon",
                "location": "On-site",
                "required_skills": ["Teamwork", "Prototyping", "Pitching"],
                "opportunity_type": OpportunityType.HACKATHON.value,
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
        latency_ms = int((time.perf_counter() - started) * 1000) + 15
        if self._feed_url:
            return SourceHealthResult(
                status=HealthStatus.HEALTHY,
                message=f"{self.source_name} community feed is reachable (mock).",
                latency_ms=latency_ms,
            )
        return SourceHealthResult(
            status=HealthStatus.UNHEALTHY,
            message=f"{self.source_name} community URL is not configured.",
            latency_ms=latency_ms,
        )
