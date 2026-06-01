import { apiClient } from "@/services/api/client";
import type { CareerProfile, CareerProfileUpdate, OnboardingStatus } from "@/types/career";

type CareerProfileApi = {
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  college: string | null;
  degree: string | null;
  graduation_year: string | null;
  current_status: CareerProfile["currentStatus"];
  experience: string | null;
  skills: string[];
  preferred_roles: string[];
  preferred_locations: string[];
  employment_type: CareerProfile["employmentType"];
  work_preference: CareerProfile["workPreference"];
  expected_salary: string | null;
  auto_apply: boolean;
  require_approval: boolean;
  daily_opportunity_limit: number;
  profile_completion: number;
  is_onboarding_completed: boolean;
};

type OnboardingStatusApi = {
  is_completed: boolean;
  current_step: number;
  profile_completion: number;
};

function mapProfile(data: CareerProfileApi): CareerProfile {
  return {
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    location: data.location,
    college: data.college,
    degree: data.degree,
    graduationYear: data.graduation_year,
    currentStatus: data.current_status,
    experience: data.experience,
    skills: data.skills ?? [],
    preferredRoles: data.preferred_roles ?? [],
    preferredLocations: data.preferred_locations ?? [],
    employmentType: data.employment_type,
    workPreference: data.work_preference,
    expectedSalary: data.expected_salary,
    autoApply: data.auto_apply,
    requireApproval: data.require_approval,
    dailyOpportunityLimit: data.daily_opportunity_limit,
    profileCompletion: data.profile_completion,
    isOnboardingCompleted: data.is_onboarding_completed,
  };
}

function mapStatus(data: OnboardingStatusApi): OnboardingStatus {
  return {
    isCompleted: data.is_completed,
    currentStep: data.current_step,
    profileCompletion: data.profile_completion,
  };
}

function toApiPayload(update: CareerProfileUpdate): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (update.currentStep !== undefined) payload.current_step = update.currentStep;
  if (update.fullName !== undefined) payload.full_name = update.fullName;
  if (update.phone !== undefined) payload.phone = update.phone;
  if (update.location !== undefined) payload.location = update.location;
  if (update.college !== undefined) payload.college = update.college;
  if (update.degree !== undefined) payload.degree = update.degree;
  if (update.graduationYear !== undefined) payload.graduation_year = update.graduationYear;
  if (update.currentStatus !== undefined) payload.current_status = update.currentStatus;
  if (update.experience !== undefined) payload.experience = update.experience;
  if (update.skills !== undefined) payload.skills = update.skills;
  if (update.preferredRoles !== undefined) payload.preferred_roles = update.preferredRoles;
  if (update.preferredLocations !== undefined) payload.preferred_locations = update.preferredLocations;
  if (update.employmentType !== undefined) payload.employment_type = update.employmentType;
  if (update.workPreference !== undefined) payload.work_preference = update.workPreference;
  if (update.expectedSalary !== undefined) payload.expected_salary = update.expectedSalary;
  if (update.autoApply !== undefined) payload.auto_apply = update.autoApply;
  if (update.requireApproval !== undefined) payload.require_approval = update.requireApproval;
  if (update.dailyOpportunityLimit !== undefined) payload.daily_opportunity_limit = update.dailyOpportunityLimit;
  return payload;
}

export const careerService = {
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    const data = await apiClient.get<OnboardingStatusApi>("/career/onboarding/status");
    return mapStatus(data);
  },

  async getProfile(): Promise<CareerProfile> {
    const data = await apiClient.get<CareerProfileApi>("/career/profile");
    return mapProfile(data);
  },

  async updateProfile(update: CareerProfileUpdate): Promise<CareerProfile> {
    const data = await apiClient.request<CareerProfileApi>("/career/profile", {
      method: "PATCH",
      body: toApiPayload(update),
    });
    return mapProfile(data);
  },

  async completeOnboarding(): Promise<{ profile: CareerProfile; onboarding: OnboardingStatus }> {
    const data = await apiClient.post<{
      profile: CareerProfileApi;
      onboarding: OnboardingStatusApi;
    }>("/career/onboarding/complete");
    return {
      profile: mapProfile(data.profile),
      onboarding: mapStatus(data.onboarding),
    };
  },
};
