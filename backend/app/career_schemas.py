from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

CurrentStatus = Literal["student", "intern", "fresher", "working_professional"]
EmploymentType = Literal["internship", "full_time", "contract"]
WorkPreference = Literal["remote", "hybrid", "onsite"]


class OnboardingStatusOut(BaseModel):
    is_completed: bool
    current_step: int = Field(ge=1, le=4)
    profile_completion: int = Field(ge=0, le=100)


class CareerProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[str] = None
    current_status: Optional[CurrentStatus] = None
    experience: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    preferred_roles: List[str] = Field(default_factory=list)
    preferred_locations: List[str] = Field(default_factory=list)
    employment_type: Optional[EmploymentType] = None
    work_preference: Optional[WorkPreference] = None
    expected_salary: Optional[str] = None
    auto_apply: bool = False
    require_approval: bool = True
    daily_opportunity_limit: int = 10
    profile_completion: int = 0
    is_onboarding_completed: bool = False


class CareerProfileUpdate(BaseModel):
    current_step: Optional[int] = Field(default=None, ge=1, le=4)
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=32)
    location: Optional[str] = Field(default=None, max_length=120)
    college: Optional[str] = Field(default=None, max_length=160)
    degree: Optional[str] = Field(default=None, max_length=120)
    graduation_year: Optional[str] = Field(default=None, max_length=8)
    current_status: Optional[CurrentStatus] = None
    experience: Optional[str] = Field(default=None, max_length=2000)
    skills: Optional[List[str]] = None
    preferred_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    employment_type: Optional[EmploymentType] = None
    work_preference: Optional[WorkPreference] = None
    expected_salary: Optional[str] = Field(default=None, max_length=64)
    auto_apply: Optional[bool] = None
    require_approval: Optional[bool] = None
    daily_opportunity_limit: Optional[int] = Field(default=None, ge=1, le=100)


class OnboardingCompleteResponse(BaseModel):
    message: str
    onboarding: OnboardingStatusOut
    profile: CareerProfileOut
