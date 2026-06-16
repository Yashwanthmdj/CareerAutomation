from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from ...opportunity_models import OpportunityType, SourceType
from ...opportunity_schemas import OpportunityCreate
from ..base_source import BaseSourceConnector, SourceHealthResult
from ..source_models import HealthStatus


class CareerPageConnector(BaseSourceConnector):
    """Connector for corporate career page sources (Google, Microsoft, Amazon)."""

    def __init__(
        self,
        *,
        source_id: str,
        source_name: str,
        source_type: SourceType,
        feed_url: str,
        company_slug: str,
    ) -> None:
        self.source_id = source_id
        self.source_name = source_name
        self._source_type = source_type
        self._feed_url = feed_url
        self._company_slug = company_slug

    async def fetch_opportunities(self) -> List[Dict[str, Any]]:
        deadline = (datetime.now(timezone.utc) + timedelta(days=45)).isoformat()
        return [
            {
                "external_id": f"{self._company_slug}-swe-intern",
                "title": f"Software Engineering Intern — {self.source_name}",
                "company": self.source_name.split(" ")[0],
                "description": f"Mock career page listing from {self.source_name} (Phase 4.1 safe mode).",
                "apply_link": f"{self._feed_url}/jobs/{self._company_slug}-swe-intern",
                "location": "Remote / Hybrid",
                "required_skills": ["Python", "Algorithms", "Data Structures"],
                "opportunity_type": OpportunityType.INTERNSHIP.value,
                "deadline": deadline,
            },
            {
                "external_id": f"{self._company_slug}-new-grad",
                "title": f"New Grad Software Engineer — {self.source_name}",
                "company": self.source_name.split(" ")[0],
                "description": f"Mock new grad role from {self.source_name} career page connector.",
                "apply_link": f"{self._feed_url}/jobs/{self._company_slug}-new-grad",
                "location": "Multiple Locations",
                "required_skills": ["Java", "Distributed Systems", "Cloud"],
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
        # Safe mode: simulate feed reachability without HTTP scraping.
        latency_ms = int((time.perf_counter() - started) * 1000) + 12
        if self._feed_url:
            return SourceHealthResult(
                status=HealthStatus.HEALTHY,
                message=f"{self.source_name} career page feed is reachable (mock).",
                latency_ms=latency_ms,
            )
        return SourceHealthResult(
            status=HealthStatus.UNHEALTHY,
            message=f"{self.source_name} feed URL is not configured.",
            latency_ms=latency_ms,
        )
