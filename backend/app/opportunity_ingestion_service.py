from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from .opportunity_models import Opportunity, SourceType
from .opportunity_schemas import OpportunityCreate, OpportunityIngestResponse, OpportunityOut
from .opportunity_service import SOURCE_LABELS, OpportunityService

_WHITESPACE_RE = re.compile(r"\s+")


@dataclass
class NormalizedOpportunity:
    title: str
    company: str
    apply_link: str
    source_name: str
    source_type: str
    description: Optional[str]
    location: Optional[str]
    deadline: Optional[object]
    required_skills: List[str]
    opportunity_type: str


def normalize_text(value: str) -> str:
    return _WHITESPACE_RE.sub(" ", value.strip().lower())


def normalize_apply_link(value: Optional[str]) -> str:
    if not value or not value.strip():
        return ""
    raw = value.strip()
    parsed = urlparse(raw if "://" in raw else f"https://{raw}")
    host = (parsed.netloc or parsed.path.split("/")[0]).lower()
    if host.startswith("www."):
        host = host[4:]
    path = (parsed.path or "").rstrip("/").lower()
    query = (parsed.query or "").lower()
    if query:
        return f"{host}{path}?{query}"
    return f"{host}{path}" if path else host


class OpportunityIngestionService:
    """Ingestion pipeline for external opportunity sources (Phase 3.5 foundation)."""

    def __init__(self, db: Session):
        self.db = db
        self._catalog = OpportunityService(db)

    def normalize_opportunity(self, payload: OpportunityCreate) -> NormalizedOpportunity:
        source_name = payload.source_name or SOURCE_LABELS.get(payload.source_type, payload.source_type.value)
        skills = [skill.strip() for skill in payload.required_skills if skill and skill.strip()]
        return NormalizedOpportunity(
            title=payload.title.strip(),
            company=payload.company.strip(),
            apply_link=normalize_apply_link(payload.apply_link),
            source_name=source_name.strip(),
            source_type=payload.source_type.value,
            description=payload.description.strip() if payload.description else None,
            location=payload.location.strip() if payload.location else None,
            deadline=payload.deadline,
            required_skills=skills,
            opportunity_type=payload.opportunity_type.value,
        )

    def deduplicate_opportunity(self, normalized: NormalizedOpportunity) -> Optional[Opportunity]:
        company_key = normalize_text(normalized.company)
        title_key = normalize_text(normalized.title)
        link_key = normalized.apply_link

        candidates = (
            self.db.query(Opportunity)
            .filter(
                Opportunity.company.ilike(normalized.company),
                Opportunity.title.ilike(normalized.title),
            )
            .all()
        )
        for candidate in candidates:
            if normalize_text(candidate.company) != company_key:
                continue
            if normalize_text(candidate.title) != title_key:
                continue
            if normalize_apply_link(candidate.apply_link) != link_key:
                continue
            return candidate
        return None

    def ingest_opportunity(self, payload: OpportunityCreate, user_id: str) -> OpportunityIngestResponse:
        normalized = self.normalize_opportunity(payload)
        existing = self.deduplicate_opportunity(normalized)
        if existing:
            opportunity_out = self._catalog.get_opportunity(existing.id, user_id)
            return OpportunityIngestResponse(
                opportunity=opportunity_out,
                is_duplicate=True,
                message="Opportunity already exists (matched company, title, and apply link).",
            )

        created = self._catalog.create_opportunity(payload)
        opportunity_out = self._catalog.get_opportunity(created.id, user_id)
        return OpportunityIngestResponse(
            opportunity=opportunity_out,
            is_duplicate=False,
            message="Opportunity ingested successfully.",
        )
