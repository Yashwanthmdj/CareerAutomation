from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from sqlalchemy.orm import Session

from .career_models import CareerPreferences, OnboardingStatus, UserProfile, UserSkill
from .models import User


def ensure_career_records(db: Session, user: User) -> tuple[OnboardingStatus, UserProfile, CareerPreferences]:
    onboarding = db.query(OnboardingStatus).filter(OnboardingStatus.user_id == user.id).first()
    if not onboarding:
        onboarding = OnboardingStatus(user_id=user.id)
        db.add(onboarding)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)

    preferences = db.query(CareerPreferences).filter(CareerPreferences.user_id == user.id).first()
    if not preferences:
        preferences = CareerPreferences(user_id=user.id, preferred_roles=[], preferred_locations=[])
        db.add(preferences)

    db.commit()
    db.refresh(onboarding)
    db.refresh(profile)
    db.refresh(preferences)
    return onboarding, profile, preferences


def sync_skills(db: Session, user: User, skills: List[str]) -> None:
    normalized = sorted({s.strip() for s in skills if s.strip()})
    existing = {skill.name: skill for skill in user.skills}
    incoming = set(normalized)

    for name in incoming - set(existing.keys()):
        db.add(UserSkill(user_id=user.id, name=name))

    for name, skill in existing.items():
        if name not in incoming:
            db.delete(skill)

    db.commit()


def compute_profile_completion(user: User, profile: UserProfile, preferences: CareerPreferences, skills: List[str]) -> int:
    checks = [
        bool(user.name.strip()),
        bool(user.email.strip()),
        bool(profile.phone and profile.phone.strip()),
        bool(profile.location and profile.location.strip()),
        bool(profile.college and profile.college.strip()),
        bool(profile.degree and profile.degree.strip()),
        bool(profile.graduation_year and profile.graduation_year.strip()),
        bool(profile.current_status),
        bool(profile.experience and profile.experience.strip()),
        len(skills) > 0,
        len(preferences.preferred_roles or []) > 0,
        len(preferences.preferred_locations or []) > 0,
        bool(preferences.employment_type),
        bool(preferences.work_preference),
    ]
    completed = sum(1 for item in checks if item)
    return round((completed / len(checks)) * 100)


def validate_onboarding_complete(
    user: User,
    profile: UserProfile,
    preferences: CareerPreferences,
    skills: List[str],
) -> List[str]:
    errors: List[str] = []
    if not user.name.strip():
        errors.append("Full name is required")
    if not profile.phone or not profile.phone.strip():
        errors.append("Phone number is required")
    if not profile.location or not profile.location.strip():
        errors.append("Location is required")
    if not profile.college or not profile.college.strip():
        errors.append("College is required")
    if not profile.degree or not profile.degree.strip():
        errors.append("Degree is required")
    if not profile.graduation_year or not profile.graduation_year.strip():
        errors.append("Graduation year is required")
    if not profile.current_status:
        errors.append("Current status is required")
    if not profile.experience or not profile.experience.strip():
        errors.append("Experience is required")
    if len(skills) == 0:
        errors.append("At least one skill is required")
    if len(preferences.preferred_roles or []) == 0:
        errors.append("At least one preferred role is required")
    if len(preferences.preferred_locations or []) == 0:
        errors.append("At least one preferred location is required")
    if not preferences.employment_type:
        errors.append("Employment type is required")
    if not preferences.work_preference:
        errors.append("Work preference is required")
    return errors


def mark_onboarding_complete(onboarding: OnboardingStatus) -> None:
    onboarding.is_completed = True
    onboarding.current_step = 4
    onboarding.completed_at = datetime.now(timezone.utc)
