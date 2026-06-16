from __future__ import annotations

from typing import Dict, List

from ..opportunity_models import SourceType
from .base_source import BaseSourceConnector
from .connectors import CareerPageConnector, CommunityConnector, StartupJobsConnector
from .source_models import ConnectorKind, OpportunitySource


SOURCE_SEEDS: List[dict] = [
    {
        "source_id": "google_careers",
        "source_name": "Google Careers",
        "connector_kind": ConnectorKind.CAREER_PAGE.value,
        "source_type": SourceType.MANUAL.value,
        "feed_url": "https://careers.google.com",
        "company_slug": "google",
        "enabled": True,
    },
    {
        "source_id": "microsoft_careers",
        "source_name": "Microsoft Careers",
        "connector_kind": ConnectorKind.CAREER_PAGE.value,
        "source_type": SourceType.MANUAL.value,
        "feed_url": "https://careers.microsoft.com",
        "company_slug": "microsoft",
        "enabled": True,
    },
    {
        "source_id": "amazon_jobs",
        "source_name": "Amazon Jobs",
        "connector_kind": ConnectorKind.CAREER_PAGE.value,
        "source_type": SourceType.MANUAL.value,
        "feed_url": "https://amazon.jobs",
        "company_slug": "amazon",
        "enabled": True,
    },
    {
        "source_id": "ycombinator_jobs",
        "source_name": "Y Combinator Jobs",
        "connector_kind": ConnectorKind.STARTUP_JOBS.value,
        "source_type": SourceType.MANUAL.value,
        "feed_url": "https://www.ycombinator.com/jobs",
        "board_slug": "yc",
        "enabled": True,
    },
    {
        "source_id": "wellfound",
        "source_name": "Wellfound",
        "connector_kind": ConnectorKind.STARTUP_JOBS.value,
        "source_type": SourceType.WELLFOUND.value,
        "feed_url": "https://wellfound.com",
        "board_slug": "wellfound",
        "enabled": True,
    },
    {
        "source_id": "student_tribe",
        "source_name": "Student Tribe",
        "connector_kind": ConnectorKind.COMMUNITY.value,
        "source_type": SourceType.STUDENT_TRIBE.value,
        "feed_url": "https://studenttribe.com",
        "community_slug": "student-tribe",
        "enabled": True,
    },
    {
        "source_id": "thub",
        "source_name": "T-Hub",
        "connector_kind": ConnectorKind.COMMUNITY.value,
        "source_type": SourceType.THUB.value,
        "feed_url": "https://t-hub.co",
        "community_slug": "thub",
        "enabled": True,
    },
]


def build_connector_for_source(row: OpportunitySource) -> BaseSourceConnector:
    seed = next((item for item in SOURCE_SEEDS if item["source_id"] == row.source_id), None)
    if not seed:
        raise ValueError(f"No connector configuration for source '{row.source_id}'")

    kind = ConnectorKind(row.connector_kind)
    if kind == ConnectorKind.CAREER_PAGE:
        return CareerPageConnector(
            source_id=row.source_id,
            source_name=row.source_name,
            source_type=SourceType(row.source_type),
            feed_url=row.feed_url or seed["feed_url"],
            company_slug=seed["company_slug"],
        )
    if kind == ConnectorKind.STARTUP_JOBS:
        return StartupJobsConnector(
            source_id=row.source_id,
            source_name=row.source_name,
            source_type=SourceType(row.source_type),
            feed_url=row.feed_url or seed["feed_url"],
            board_slug=seed["board_slug"],
        )
    if kind == ConnectorKind.COMMUNITY:
        return CommunityConnector(
            source_id=row.source_id,
            source_name=row.source_name,
            source_type=SourceType(row.source_type),
            feed_url=row.feed_url or seed["feed_url"],
            community_slug=seed["community_slug"],
        )
    raise ValueError(f"Unsupported connector kind: {row.connector_kind}")


def connector_registry_from_rows(rows: List[OpportunitySource]) -> Dict[str, BaseSourceConnector]:
    return {row.source_id: build_connector_for_source(row) for row in rows}
