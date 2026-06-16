from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Dict, List, Optional


@dataclass
class ScoutSourceBreakdown:
    source_name: str
    found: int = 0
    ingested: int = 0
    duplicates: int = 0


@dataclass
class ScoutRunResult:
    status: str = "idle"
    sources: List[str] = field(default_factory=list)
    total_found: int = 0
    total_ingested: int = 0
    duplicates: int = 0
    source_breakdown: List[ScoutSourceBreakdown] = field(default_factory=list)
    last_run_at: Optional[datetime] = None
    message: Optional[str] = None
    duration_ms: Optional[int] = None


@dataclass
class ScoutDailyMetrics:
    day: date = field(default_factory=lambda: datetime.now(timezone.utc).date())
    opportunities_found: int = 0
    opportunities_ingested: int = 0
    duplicates_removed: int = 0


@dataclass
class ScoutState:
    """In-memory scout run state and daily counters."""

    last_result: ScoutRunResult = field(default_factory=ScoutRunResult)
    connected_sources: List[str] = field(default_factory=list)
    is_running: bool = False
    daily: ScoutDailyMetrics = field(default_factory=ScoutDailyMetrics)

    def record_run(self, result: ScoutRunResult) -> None:
        now = result.last_run_at or datetime.now(timezone.utc)
        result.last_run_at = now
        self.last_result = result
        self.is_running = False

        today = now.date()
        if self.daily.day != today:
            self.daily = ScoutDailyMetrics(day=today)
        self.daily.opportunities_found += result.total_found
        self.daily.opportunities_ingested += result.total_ingested
        self.daily.duplicates_removed += result.duplicates


CONNECTOR_SOURCES = [
    "Google Careers",
    "Microsoft Careers",
    "Amazon Jobs",
    "Y Combinator Jobs",
    "Wellfound",
    "Student Tribe",
    "T-Hub",
]

_scout_state = ScoutState(connected_sources=list(CONNECTOR_SOURCES))


def get_scout_state() -> ScoutState:
    return _scout_state


def reset_scout_state_for_tests() -> None:
    """Reset in-memory scout state (tests only)."""
    global _scout_state
    _scout_state = ScoutState(connected_sources=list(CONNECTOR_SOURCES))
