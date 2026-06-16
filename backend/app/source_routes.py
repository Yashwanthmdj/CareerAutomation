from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .database import get_db
from .deps import get_current_user
from .models import User
from .sources.source_schemas import OpportunitySourceListOut, SourceHealthOut, SourceSyncResponse
from .sources.source_service import SourceService

router = APIRouter(prefix="/sources", tags=["sources"])


def _service(db: Session) -> SourceService:
    return SourceService(db)


@router.get("", response_model=OpportunitySourceListOut)
def list_sources(
    enabled_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).list_sources(enabled_only=enabled_only)


@router.get("/health", response_model=SourceHealthOut)
async def get_sources_health(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await _service(db).check_health()


@router.post("/{source_id}/sync", response_model=SourceSyncResponse)
async def sync_source(
    source_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await _service(db).sync_source(source_id, current_user.id)
