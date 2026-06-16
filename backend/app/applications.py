from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .application_schemas import (
    ApplicationCreate,
    ApplicationDashboardMetrics,
    ApplicationDeleteResponse,
    ApplicationListOut,
    ApplicationOut,
    ApplicationStatusUpdate,
)
from .application_service import ApplicationService
from .database import get_db
from .deps import get_current_user
from .models import User

router = APIRouter(prefix="/applications", tags=["applications"])


def _service(db: Session) -> ApplicationService:
    return ApplicationService(db)


@router.get("/metrics/dashboard", response_model=ApplicationDashboardMetrics)
def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).get_dashboard_metrics(current_user)


@router.get("", response_model=ApplicationListOut)
def list_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    applications = _service(db).get_user_applications(current_user)
    return ApplicationListOut(applications=applications, total=len(applications))


@router.post("", response_model=ApplicationOut, status_code=201)
def create_application(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).create_application(current_user, payload)


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).get_application(current_user, application_id)


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _service(db).update_status(current_user, application_id, payload)


@router.delete("/{application_id}", response_model=ApplicationDeleteResponse)
def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _service(db).delete_application(current_user, application_id)
    return ApplicationDeleteResponse()
