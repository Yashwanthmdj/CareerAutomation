from __future__ import annotations

import asyncio
import logging
from typing import Optional

from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from ..config import settings
from ..models import User
from .scout_service import ScoutService

logger = logging.getLogger(__name__)


class ScoutScheduler:
    """Background scheduler for Opportunity Scout connector runs."""

    def __init__(self) -> None:
        self._task: Optional[asyncio.Task] = None
        self._stop_event: Optional[asyncio.Event] = None

    def _get_stop_event(self) -> asyncio.Event:
        if self._stop_event is None:
            self._stop_event = asyncio.Event()
        return self._stop_event

    @property
    def interval_seconds(self) -> int:
        return max(1, settings.scout_interval_minutes) * 60

    def start(self, engine: Engine) -> None:
        if not settings.scout_scheduler_enabled:
            logger.info("Scout scheduler disabled via configuration.")
            return
        if self._task and not self._task.done():
            return
        loop = asyncio.get_event_loop()
        self._get_stop_event().clear()
        self._task = loop.create_task(self._run_loop(engine))
        logger.info(
            "Scout scheduler started (interval=%s minutes).",
            settings.scout_interval_minutes,
        )

    async def stop(self) -> None:
        if self._stop_event is not None:
            self._stop_event.set()
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _run_loop(self, engine: Engine) -> None:
        stop_event = self._get_stop_event()
        while not stop_event.is_set():
            await self.run_scheduled_scan(engine)
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=self.interval_seconds)
            except asyncio.TimeoutError:
                continue

    async def run_scheduled_scan(self, engine: Engine) -> bool:
        """Run a scheduled scout scan when the agent is enabled and ready."""
        with Session(engine) as db:
            service = ScoutService(db)
            if not service.scout_agent_can_run():
                return False
            user = db.query(User).first()
            if not user:
                logger.warning("Scout scheduler skipped: no users in database.")
                return False
            await service.run_all_connectors(user.id, trigger="scheduler")
            return True


scout_scheduler = ScoutScheduler()
