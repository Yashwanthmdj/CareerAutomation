from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .career_schemas import (
    CareerProfileOut,
    CareerProfileUpdate,
    OnboardingCompleteResponse,
    OnboardingStatusOut,
)
from .career_service import (
    compute_profile_completion,
    ensure_career_records,
    mark_onboarding_complete,
    sync_skills,
    validate_onboarding_complete,
)
from .database import get_db
from .deps import get_current_user
from .models import User

router = APIRouter(prefix="/career", tags=["career"])


def build_profile_response(db: Session, user: User) -> CareerProfileOut:
    ensure_career_records(db, user)
    db.refresh(user)
    profile_row = user.profile
    preferences_row = user.career_preferences
    onboarding_row = user.onboarding_status
    skills = sorted(skill.name for skill in user.skills)
    completion = compute_profile_completion(user, profile_row, preferences_row, skills)

    return CareerProfileOut(
        full_name=user.name,
        email=user.email,
        phone=profile_row.phone,
        location=profile_row.location,
        college=profile_row.college,
        degree=profile_row.degree,
        graduation_year=profile_row.graduation_year,
        current_status=profile_row.current_status,
        experience=profile_row.experience,
        skills=skills,
        preferred_roles=preferences_row.preferred_roles or [],
        preferred_locations=preferences_row.preferred_locations or [],
        employment_type=preferences_row.employment_type,
        work_preference=preferences_row.work_preference,
        expected_salary=preferences_row.expected_salary,
        auto_apply=profile_row.auto_apply,
        require_approval=profile_row.require_approval,
        daily_opportunity_limit=profile_row.daily_opportunity_limit,
        profile_completion=completion,
        is_onboarding_completed=onboarding_row.is_completed,
    )


def build_onboarding_status(db: Session, user: User) -> OnboardingStatusOut:
    onboarding, profile, preferences = ensure_career_records(db, user)
    db.refresh(user)
    skills = [skill.name for skill in user.skills]
    completion = compute_profile_completion(user, profile, preferences, skills)
    return OnboardingStatusOut(
        is_completed=onboarding.is_completed,
        current_step=onboarding.current_step,
        profile_completion=completion,
    )


@router.get("/onboarding/status", response_model=OnboardingStatusOut)
def get_onboarding_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_onboarding_status(db, current_user)


@router.get("/profile", response_model=CareerProfileOut)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_profile_response(db, current_user)


@router.patch("/profile", response_model=CareerProfileOut)
def update_profile(
    payload: CareerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    onboarding, profile, preferences = ensure_career_records(db, current_user)
    db.refresh(current_user)

    if payload.full_name is not None:
        current_user.name = payload.full_name.strip()

    if payload.phone is not None:
        profile.phone = payload.phone.strip() or None
    if payload.location is not None:
        profile.location = payload.location.strip() or None
    if payload.college is not None:
        profile.college = payload.college.strip() or None
    if payload.degree is not None:
        profile.degree = payload.degree.strip() or None
    if payload.graduation_year is not None:
        profile.graduation_year = payload.graduation_year.strip() or None
    if payload.current_status is not None:
        profile.current_status = payload.current_status
    if payload.experience is not None:
        profile.experience = payload.experience.strip() or None
    if payload.auto_apply is not None:
        profile.auto_apply = payload.auto_apply
    if payload.require_approval is not None:
        profile.require_approval = payload.require_approval
    if payload.daily_opportunity_limit is not None:
        profile.daily_opportunity_limit = payload.daily_opportunity_limit

    if payload.preferred_roles is not None:
        preferences.preferred_roles = [r.strip() for r in payload.preferred_roles if r.strip()]
    if payload.preferred_locations is not None:
        preferences.preferred_locations = [l.strip() for l in payload.preferred_locations if l.strip()]
    if payload.employment_type is not None:
        preferences.employment_type = payload.employment_type
    if payload.work_preference is not None:
        preferences.work_preference = payload.work_preference
    if payload.expected_salary is not None:
        preferences.expected_salary = payload.expected_salary.strip() or None

    if payload.current_step is not None:
        onboarding.current_step = max(onboarding.current_step, payload.current_step)

    if payload.skills is not None:
        sync_skills(db, current_user, payload.skills)
        db.refresh(current_user)

    db.add(current_user)
    db.add(profile)
    db.add(preferences)
    db.add(onboarding)
    db.commit()
    db.refresh(current_user)

    return build_profile_response(db, current_user)


@router.post("/onboarding/complete", response_model=OnboardingCompleteResponse)
def complete_onboarding(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    onboarding, profile, preferences = ensure_career_records(db, current_user)
    db.refresh(current_user)
    skills = [skill.name for skill in current_user.skills]

    errors = validate_onboarding_complete(current_user, profile, preferences, skills)
    if errors:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail={"errors": errors})

    mark_onboarding_complete(onboarding)
    db.add(onboarding)
    db.commit()
    db.refresh(current_user)

    return OnboardingCompleteResponse(
        message="Onboarding completed successfully",
        onboarding=build_onboarding_status(db, current_user),
        profile=build_profile_response(db, current_user),
    )
