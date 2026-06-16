from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..automation_models import AgentStatus, AgentType, AutomationAgent, AutomationExecution, ExecutionStatus
from ..automation_schemas import RecordExecutionRequest
from ..automation_service import AutomationService
from ..opportunity_ingestion_service import OpportunityIngestionService
from ..opportunity_schemas import OpportunityCreate
from ..sources.base_source import BaseSourceConnector
from ..sources.source_service import SourceService
from .scout_models import ScoutRunResult, ScoutSourceBreakdown, get_scout_state
from .scout_schemas import (
    ScoutHistoryItemOut,
    ScoutHistoryOut,
    ScoutMetricsOut,
    ScoutRunResponse,
    ScoutSourceBreakdownOut,
    ScoutStatusOut,
)


def _normalize_source_key(source_name: str) -> str:
    return source_name.strip().lower().replace(" ", "").replace("-", "").replace("_", "")


class ScoutService:
    """Opportunity Scout pipeline backed by the pluggable source framework (Phase 4.1)."""

    def __init__(self, db: Session):
        self.db = db
        self._ingestion = OpportunityIngestionService(db)
        self._automation = AutomationService(db)
        self._sources = SourceService(db)
        self._connectors: Dict[str, BaseSourceConnector] = self._sources.get_enabled_connectors()

    def _refresh_connectors(self) -> None:
        self._connectors = self._sources.get_enabled_connectors()

    def _resolve_connector(self, source_name: str) -> BaseSourceConnector:
        self._refresh_connectors()
        by_id = self._connectors.get(source_name)
        if by_id:
            return by_id

        for connector in self._connectors.values():
            if _normalize_source_key(connector.source_name) == _normalize_source_key(source_name):
                return connector
            if _normalize_source_key(connector.source_id) == _normalize_source_key(source_name):
                return connector

        known = ", ".join(sorted({c.source_name for c in self._connectors.values()}))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown scout source '{source_name}'. Known sources: {known}",
        )

    def _get_scout_agent(self) -> Optional[AutomationAgent]:
        return (
            self.db.query(AutomationAgent)
            .filter(AutomationAgent.agent_type == AgentType.OPPORTUNITY_SCOUT.value)
            .first()
        )

    def scout_agent_can_run(self) -> bool:
        agent = self._get_scout_agent()
        return bool(
            agent
            and agent.enabled
            and agent.status == AgentStatus.READY.value,
        )

    def _ensure_scout_may_run(self) -> AutomationAgent:
        agent = self._get_scout_agent()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Opportunity Scout agent is not registered.",
            )
        if not agent.enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Opportunity Scout agent is disabled.",
            )
        if agent.status != AgentStatus.READY.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Opportunity Scout agent is not ready (status={agent.status}).",
            )
        return agent

    def ingest_results(
        self,
        payloads: List[OpportunityCreate],
        source_name: str,
        user_id: str,
    ) -> ScoutSourceBreakdown:
        breakdown = ScoutSourceBreakdown(source_name=source_name, found=len(payloads))
        for payload in payloads:
            result = self._ingestion.ingest_opportunity(payload, user_id)
            if result.is_duplicate:
                breakdown.duplicates += 1
            else:
                breakdown.ingested += 1
        return breakdown

    def _record_execution(
        self,
        agent: AutomationAgent,
        result: ScoutRunResult,
        trigger: str,
    ) -> None:
        details = {
            "trigger": trigger,
            "sources_scanned": result.sources,
            "opportunities_found": result.total_found,
            "opportunities_ingested": result.total_ingested,
            "duplicates_removed": result.duplicates,
            "source_breakdown": [
                {
                    "source_name": row.source_name,
                    "found": row.found,
                    "ingested": row.ingested,
                    "duplicates": row.duplicates,
                }
                for row in result.source_breakdown
            ],
        }
        exec_status = ExecutionStatus.SUCCESS if result.status == "success" else ExecutionStatus.FAILED
        self._automation.record_execution(
            agent.id,
            RecordExecutionRequest(
                status=exec_status,
                duration_ms=result.duration_ms,
                details_json=details,
            ),
        )

    def _to_run_response(self, result: ScoutRunResult) -> ScoutRunResponse:
        return ScoutRunResponse(
            status=result.status,
            sources=result.sources,
            found=result.total_found,
            ingested=result.total_ingested,
            duplicates=result.duplicates,
            source_breakdown=[
                ScoutSourceBreakdownOut(
                    source_name=row.source_name,
                    found=row.found,
                    ingested=row.ingested,
                    duplicates=row.duplicates,
                )
                for row in result.source_breakdown
            ],
            message=result.message,
            duration_ms=result.duration_ms,
        )

    async def run_connector(
        self,
        source_name: str,
        user_id: str,
        *,
        trigger: str = "manual",
        skip_agent_gate: bool = False,
    ) -> ScoutRunResponse:
        state = get_scout_state()
        if state.is_running:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Scout run already in progress.",
            )

        agent = self._ensure_scout_may_run() if not skip_agent_gate else None
        connector = self._resolve_connector(source_name)
        state.is_running = True
        started = time.perf_counter()

        try:
            sync_result = await self._sources.sync_source(connector.source_id, user_id)
            breakdown = ScoutSourceBreakdown(
                source_name=sync_result.source_name,
                found=sync_result.found,
                ingested=sync_result.ingested,
                duplicates=sync_result.duplicates,
            )
            duration_ms = sync_result.duration_ms or int((time.perf_counter() - started) * 1000)
            result = ScoutRunResult(
                status="success",
                sources=[connector.source_name],
                total_found=breakdown.found,
                total_ingested=breakdown.ingested,
                duplicates=breakdown.duplicates,
                source_breakdown=[breakdown],
                last_run_at=datetime.now(timezone.utc),
                duration_ms=duration_ms,
            )
            state.record_run(result)
            if agent:
                self._record_execution(agent, result, trigger)
            return self._to_run_response(result)
        except HTTPException:
            state.is_running = False
            raise
        except Exception as exc:
            state.is_running = False
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Scout run failed for {connector.source_name}: {exc}",
            ) from exc

    async def run_all_connectors(
        self,
        user_id: str,
        *,
        trigger: str = "manual",
        skip_agent_gate: bool = False,
    ) -> ScoutRunResponse:
        state = get_scout_state()
        if state.is_running:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Scout run already in progress.",
            )

        agent = self._ensure_scout_may_run() if not skip_agent_gate else None
        self._refresh_connectors()
        state.is_running = True
        started = time.perf_counter()
        breakdowns: List[ScoutSourceBreakdown] = []

        try:
            for connector in self._connectors.values():
                sync_result = await self._sources.sync_source(connector.source_id, user_id)
                breakdowns.append(
                    ScoutSourceBreakdown(
                        source_name=sync_result.source_name,
                        found=sync_result.found,
                        ingested=sync_result.ingested,
                        duplicates=sync_result.duplicates,
                    ),
                )

            duration_ms = int((time.perf_counter() - started) * 1000)
            result = ScoutRunResult(
                status="success",
                sources=[row.source_name for row in breakdowns],
                total_found=sum(row.found for row in breakdowns),
                total_ingested=sum(row.ingested for row in breakdowns),
                duplicates=sum(row.duplicates for row in breakdowns),
                source_breakdown=breakdowns,
                last_run_at=datetime.now(timezone.utc),
                duration_ms=duration_ms,
            )
            state.connected_sources = self._sources.list_enabled_source_names()
            state.record_run(result)
            if agent:
                self._record_execution(agent, result, trigger)
            return self._to_run_response(result)
        except HTTPException:
            state.is_running = False
            raise
        except Exception as exc:
            state.is_running = False
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Scout run failed: {exc}",
            ) from exc

    def collect_metrics(self) -> ScoutMetricsOut:
        state = get_scout_state()
        last = state.last_result
        enabled_sources = self._sources.list_enabled_source_names()
        state.connected_sources = enabled_sources
        return ScoutMetricsOut(
            scanned_sources=len(enabled_sources),
            opportunities_found=last.total_found,
            opportunities_ingested=last.total_ingested,
            duplicates_removed=last.duplicates,
            last_scan_at=last.last_run_at,
            new_today=state.daily.opportunities_found,
            ingested_today=state.daily.opportunities_ingested,
        )

    def get_history(self, limit: int = 20) -> ScoutHistoryOut:
        agent = self._get_scout_agent()
        if not agent:
            return ScoutHistoryOut(items=[], total=0)

        rows = (
            self.db.query(AutomationExecution)
            .filter(AutomationExecution.agent_id == agent.id)
            .order_by(desc(AutomationExecution.started_at))
            .limit(limit)
            .all()
        )

        items: List[ScoutHistoryItemOut] = []
        for row in rows:
            details = row.details_json or {}
            items.append(
                ScoutHistoryItemOut(
                    id=row.id,
                    status=row.status,
                    started_at=row.started_at,
                    completed_at=row.completed_at,
                    duration_ms=row.duration_ms,
                    sources_scanned=details.get("sources_scanned", []),
                    opportunities_found=int(details.get("opportunities_found", 0)),
                    opportunities_ingested=int(details.get("opportunities_ingested", 0)),
                    duplicates_removed=int(details.get("duplicates_removed", 0)),
                    trigger=details.get("trigger"),
                    details_json=details,
                ),
            )

        return ScoutHistoryOut(items=items, total=len(items))

    def get_status(self) -> ScoutStatusOut:
        state = get_scout_state()
        last = state.last_result
        metrics = self.collect_metrics()
        enabled_sources = self._sources.list_enabled_source_names()
        state.connected_sources = enabled_sources
        return ScoutStatusOut(
            status="running" if state.is_running else last.status,
            connected_sources=enabled_sources,
            last_run_at=last.last_run_at,
            last_run_status=last.status if last.last_run_at else None,
            opportunities_found=last.total_found,
            opportunities_ingested=last.total_ingested,
            duplicates=last.duplicates,
            is_running=state.is_running,
            source_breakdown=[
                ScoutSourceBreakdownOut(
                    source_name=row.source_name,
                    found=row.found,
                    ingested=row.ingested,
                    duplicates=row.duplicates,
                )
                for row in last.source_breakdown
            ],
            metrics=metrics,
        )

    def list_registered_sources(self) -> List[str]:
        return self._sources.list_enabled_source_names()

    async def run_source(self, source_name: str, user_id: str) -> ScoutRunResponse:
        return await self.run_connector(source_name, user_id)

    async def run_all_sources(self, user_id: str) -> ScoutRunResponse:
        return await self.run_all_connectors(user_id)


OpportunityScoutService = ScoutService
