from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .database import get_db
from .deps import get_current_user
from .models import User
from .scout.scout_schemas import ScoutHistoryOut, ScoutRunResponse, ScoutStatusOut
from .scout.scout_service import ScoutService

router = APIRouter(prefix="/scout", tags=["scout"])


def _service(db: Session) -> ScoutService:
    return ScoutService(db)


@router.get("/status", response_model=ScoutStatusOut)
def get_scout_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).get_status()


@router.post("/run", response_model=ScoutRunResponse)
async def run_all_scouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run all registered source connectors and ingest discovered opportunities."""
    return await _service(db).run_all_connectors(current_user.id)


@router.post("/run/{source_name}", response_model=ScoutRunResponse)
async def run_scout_source(
    source_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run a single source connector and ingest discovered opportunities."""
    return await _service(db).run_connector(source_name, current_user.id)


@router.get("/history", response_model=ScoutHistoryOut)
def get_scout_history(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).get_history(limit=limit)
