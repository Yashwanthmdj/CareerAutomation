from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from ..opportunity_ingestion_service import OpportunityIngestionService
from ..opportunity_schemas import OpportunityCreate
from .base_source import BaseSourceConnector
from .source_models import HealthStatus, OpportunitySource
from .source_registry import SOURCE_SEEDS, build_connector_for_source, connector_registry_from_rows
from .source_schemas import (
    OpportunitySourceListOut,
    OpportunitySourceOut,
    SourceHealthItemOut,
    SourceHealthOut,
    SourceSyncResponse,
)


def seed_sources_in_session(db: Session) -> bool:
    """Insert default opportunity sources when missing."""
    existing_ids = {row[0] for row in db.query(OpportunitySource.source_id).all()}
    created = False
    for seed in SOURCE_SEEDS:
        if seed["source_id"] in existing_ids:
            continue
        db.add(
            OpportunitySource(
                source_id=seed["source_id"],
                source_name=seed["source_name"],
                connector_kind=seed["connector_kind"],
                source_type=seed["source_type"],
                enabled=seed.get("enabled", True),
                health_status=HealthStatus.UNKNOWN.value,
                feed_url=seed.get("feed_url"),
            ),
        )
        created = True
    return created


def seed_opportunity_sources(engine: Engine) -> None:
    with Session(engine) as db:
        if seed_sources_in_session(db):
            db.commit()


class SourceService:
    def __init__(self, db: Session):
        self.db = db
        self._ingestion = OpportunityIngestionService(db)

    def _get_source_or_404(self, source_id: str) -> OpportunitySource:
        row = self.db.query(OpportunitySource).filter(OpportunitySource.source_id == source_id).first()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Opportunity source '{source_id}' not found.",
            )
        return row

    def _resolve_connector(self, source_id: str) -> Tuple[OpportunitySource, BaseSourceConnector]:
        row = self._get_source_or_404(source_id)
        return row, build_connector_for_source(row)

    def _to_out(self, row: OpportunitySource) -> OpportunitySourceOut:
        return OpportunitySourceOut.model_validate(row)

    def list_sources(self, *, enabled_only: bool = False) -> OpportunitySourceListOut:
        query = self.db.query(OpportunitySource)
        if enabled_only:
            query = query.filter(OpportunitySource.enabled.is_(True))
        rows = query.order_by(OpportunitySource.source_name).all()
        sources = [self._to_out(row) for row in rows]
        return OpportunitySourceListOut(
            sources=sources,
            total=len(sources),
            enabled_count=sum(1 for row in rows if row.enabled),
        )

    async def check_health(self, source_id: Optional[str] = None) -> SourceHealthOut:
        if source_id:
            rows = [self._get_source_or_404(source_id)]
        else:
            rows = self.db.query(OpportunitySource).order_by(OpportunitySource.source_name).all()

        items: List[SourceHealthItemOut] = []
        for row in rows:
            connector = build_connector_for_source(row)
            result = await connector.health_check()
            row.health_status = result.status.value
            row.updated_at = datetime.now(timezone.utc)
            self.db.add(row)

            items.append(
                SourceHealthItemOut(
                    source_id=row.source_id,
                    source_name=row.source_name,
                    health_status=result.status,
                    message=result.message,
                    latency_ms=result.latency_ms,
                    last_sync=row.last_sync,
                    records_fetched=row.records_fetched,
                    enabled=row.enabled,
                ),
            )

        self.db.commit()
        return SourceHealthOut(
            items=items,
            healthy_count=sum(1 for item in items if item.health_status == HealthStatus.HEALTHY),
            degraded_count=sum(1 for item in items if item.health_status == HealthStatus.DEGRADED),
            unhealthy_count=sum(1 for item in items if item.health_status == HealthStatus.UNHEALTHY),
            unknown_count=sum(1 for item in items if item.health_status == HealthStatus.UNKNOWN),
        )

    def _ingest_payloads(
        self,
        payloads: List[OpportunityCreate],
        user_id: str,
    ) -> tuple[int, int, int]:
        found = len(payloads)
        ingested = 0
        duplicates = 0
        for payload in payloads:
            result = self._ingestion.ingest_opportunity(payload, user_id)
            if result.is_duplicate:
                duplicates += 1
            else:
                ingested += 1
        return found, ingested, duplicates

    async def sync_source(self, source_id: str, user_id: str) -> SourceSyncResponse:
        row, connector = self._resolve_connector(source_id)
        if not row.enabled:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Source '{source_id}' is disabled.",
            )

        started = time.perf_counter()
        try:
            payloads = await connector.collect()
            found, ingested, duplicates = self._ingest_payloads(payloads, user_id)
            health = await connector.health_check()
            duration_ms = int((time.perf_counter() - started) * 1000)
            now = datetime.now(timezone.utc)

            row.last_sync = now
            row.records_fetched = found
            row.health_status = health.status.value
            row.updated_at = now
            self.db.add(row)
            self.db.commit()
            self.db.refresh(row)

            return SourceSyncResponse(
                source_id=row.source_id,
                source_name=row.source_name,
                status="success",
                found=found,
                ingested=ingested,
                duplicates=duplicates,
                records_fetched=row.records_fetched,
                health_status=health.status,
                last_sync=row.last_sync,
                duration_ms=duration_ms,
            )
        except HTTPException:
            raise
        except Exception as exc:
            row.health_status = HealthStatus.UNHEALTHY.value
            row.updated_at = datetime.now(timezone.utc)
            self.db.add(row)
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Source sync failed for {row.source_name}: {exc}",
            ) from exc

    async def sync_all_enabled(self, user_id: str) -> List[SourceSyncResponse]:
        rows = (
            self.db.query(OpportunitySource)
            .filter(OpportunitySource.enabled.is_(True))
            .order_by(OpportunitySource.source_name)
            .all()
        )
        results: List[SourceSyncResponse] = []
        for row in rows:
            results.append(await self.sync_source(row.source_id, user_id))
        return results

    def get_enabled_connectors(self) -> Dict[str, BaseSourceConnector]:
        rows = (
            self.db.query(OpportunitySource)
            .filter(OpportunitySource.enabled.is_(True))
            .order_by(OpportunitySource.source_name)
            .all()
        )
        return connector_registry_from_rows(rows)

    def list_enabled_source_names(self) -> List[str]:
        rows = (
            self.db.query(OpportunitySource)
            .filter(OpportunitySource.enabled.is_(True))
            .order_by(OpportunitySource.source_name)
            .all()
        )
        return [row.source_name for row in rows]
