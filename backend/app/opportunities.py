from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .database import get_db
from .deps import get_current_user
from .models import User
from .opportunity_models import OpportunityType, SourceType
from .opportunity_ingestion_service import OpportunityIngestionService
from .opportunity_schemas import (
    OpportunityCreate,
    OpportunityDeleteResponse,
    OpportunityIngestRequest,
    OpportunityIngestResponse,
    OpportunityListOut,
    OpportunityOut,
    OpportunitySaveResponse,
    SavedOpportunityListOut,
    SavedOpportunityOut,
)
from .opportunity_matching_schemas import OpportunityMatchOut, OpportunityRecommendationListOut
from .opportunity_matching_service import OpportunityMatchingService
from .opportunity_service import OpportunityService

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


def _service(db: Session) -> OpportunityService:
    return OpportunityService(db)


def _ingestion(db: Session) -> OpportunityIngestionService:
    return OpportunityIngestionService(db)


def _matching(db: Session) -> OpportunityMatchingService:
    return OpportunityMatchingService(db)


@router.get("/recommended/me", response_model=OpportunityRecommendationListOut)
def list_recommended_opportunities(
    min_score: int = Query(default=0, ge=0, le=100),
    limit: Optional[int] = Query(default=None, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Personalized opportunity recommendations sorted by highest match score."""
    return _matching(db).get_opportunity_recommendations(
        current_user,
        min_score=min_score,
        limit=limit,
    )


@router.get("/saved/me", response_model=SavedOpportunityListOut)
def list_my_saved_opportunities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows, total = _service(db).list_saved(current_user.id)
    return SavedOpportunityListOut(
        saved=[
            SavedOpportunityOut(id=row.id, opportunity=opportunity, saved_at=row.saved_at)
            for row, opportunity in rows
        ],
        total=total,
    )


@router.get("/search", response_model=OpportunityListOut)
def search_opportunities(
    q: Optional[str] = Query(default=None, description="Search title, company, or skills"),
    source_type: Optional[SourceType] = Query(default=None),
    opportunity_type: Optional[OpportunityType] = Query(default=None),
    saved_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = _service(db).list_opportunities(
        current_user.id,
        search=q,
        source_type=source_type,
        opportunity_type=opportunity_type,
        saved_only=saved_only,
    )
    return OpportunityListOut(opportunities=items, total=total)


@router.post("/ingest", response_model=OpportunityIngestResponse, status_code=201)
def ingest_opportunity(
    payload: OpportunityIngestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ingest an opportunity through normalize → deduplicate → persist pipeline."""
    return _ingestion(db).ingest_opportunity(payload, current_user.id)


@router.get("", response_model=OpportunityListOut)
def list_opportunities(
    q: Optional[str] = Query(default=None, description="Search title, company, or skills"),
    source_type: Optional[SourceType] = Query(default=None),
    opportunity_type: Optional[OpportunityType] = Query(default=None),
    saved_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = _service(db).list_opportunities(
        current_user.id,
        search=q,
        source_type=source_type,
        opportunity_type=opportunity_type,
        saved_only=saved_only,
    )
    return OpportunityListOut(opportunities=items, total=total)


@router.post("", response_model=OpportunityOut, status_code=201)
def create_opportunity(
    payload: OpportunityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = _service(db)
    opportunity = service.create_opportunity(payload)
    return service.get_opportunity(opportunity.id, current_user.id)


@router.get("/{opportunity_id}/match", response_model=OpportunityMatchOut)
def get_opportunity_match(
    opportunity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Match analysis for one opportunity against the user's active resume."""
    return _matching(db).get_match_for_opportunity(current_user, opportunity_id)


@router.get("/{opportunity_id}", response_model=OpportunityOut)
def get_opportunity(
    opportunity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).get_opportunity(opportunity_id, current_user.id)


@router.delete("/{opportunity_id}", response_model=OpportunityDeleteResponse)
def delete_opportunity(
    opportunity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _service(db).delete_opportunity(opportunity_id)
    return OpportunityDeleteResponse()


@router.post("/{opportunity_id}/save", response_model=OpportunitySaveResponse)
def save_opportunity(
    opportunity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _service(db).save_opportunity(current_user.id, opportunity_id)
    return OpportunitySaveResponse(opportunity_id=opportunity_id)


@router.delete("/{opportunity_id}/save", response_model=OpportunitySaveResponse)
def unsave_opportunity(
    opportunity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _service(db).unsave_opportunity(current_user.id, opportunity_id)
    return OpportunitySaveResponse(message="Opportunity unsaved", opportunity_id=opportunity_id)
