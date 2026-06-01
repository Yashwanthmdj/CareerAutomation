export type CurrentStatus = "student" | "intern" | "fresher" | "working_professional";
export type EmploymentType = "internship" | "full_time" | "contract";
export type WorkPreference = "remote" | "hybrid" | "onsite";

export type CareerProfile = {
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  college: string | null;
  degree: string | null;
  graduationYear: string | null;
  currentStatus: CurrentStatus | null;
  experience: string | null;
  skills: string[];
  preferredRoles: string[];
  preferredLocations: string[];
  employmentType: EmploymentType | null;
  workPreference: WorkPreference | null;
  expectedSalary: string | null;
  autoApply: boolean;
  requireApproval: boolean;
  dailyOpportunityLimit: number;
  profileCompletion: number;
  isOnboardingCompleted: boolean;
};

export type OnboardingStatus = {
  isCompleted: boolean;
  currentStep: number;
  profileCompletion: number;
};

export type CareerProfileUpdate = Partial<{
  currentStep: number;
  fullName: string;
  phone: string;
  location: string;
  college: string;
  degree: string;
  graduationYear: string;
  currentStatus: CurrentStatus;
  experience: string;
  skills: string[];
  preferredRoles: string[];
  preferredLocations: string[];
  employmentType: EmploymentType;
  workPreference: WorkPreference;
  expectedSalary: string;
  autoApply: boolean;
  requireApproval: boolean;
  dailyOpportunityLimit: number;
}>;

export const CURRENT_STATUS_OPTIONS: { value: CurrentStatus; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "intern", label: "Intern" },
  { value: "fresher", label: "Fresher" },
  { value: "working_professional", label: "Working Professional" },
];

export const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "internship", label: "Internship" },
  { value: "full_time", label: "Full Time" },
  { value: "contract", label: "Contract" },
];

export const WORK_PREFERENCE_OPTIONS: { value: WorkPreference; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

export const SUGGESTED_ROLES = [
  "Software Engineer",
  "AI Engineer",
  "ML Engineer",
  "Product Manager",
  "Designer",
  "Data Scientist",
  "DevOps Engineer",
];
