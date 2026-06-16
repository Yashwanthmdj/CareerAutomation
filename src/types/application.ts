import type { Opportunity } from "@/types/opportunity";

export type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "ASSESSMENT"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED";

export type Application = {
  id: string;
  userId: string;
  opportunityId: string;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: string | null;
  assessmentAt: string | null;
  interviewAt: string | null;
  offerAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  opportunity: Opportunity;
  matchScore: number | null;
  matchLevel: string | null;
};

export type ApplicationDashboardMetrics = {
  activeApplications: number;
  interviews: number;
  offers: number;
  rejected: number;
  successRate: number;
  interviewRate: number;
  offerRate: number;
  applicationsCount: number;
  funnel: Array<{
    stage: ApplicationStatus;
    label: string;
    count: number;
  }>;
};

export const APPLICATION_COLUMNS: Array<{ status: ApplicationStatus; label: string }> = [
  { status: "SAVED", label: "Saved" },
  { status: "APPLIED", label: "Applied" },
  { status: "ASSESSMENT", label: "Assessment" },
  { status: "INTERVIEW", label: "Interview" },
  { status: "OFFER", label: "Offer" },
  { status: "REJECTED", label: "Rejected" },
];

export function applicationStatusLabel(status: ApplicationStatus): string {
  return APPLICATION_COLUMNS.find((col) => col.status === status)?.label ?? status;
}

export function applicationStatusBadgeClass(status: ApplicationStatus): string {
  switch (status) {
    case "SAVED":
      return "border-violet-400/25 bg-violet-400/10 text-violet-200";
    case "APPLIED":
      return "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";
    case "ASSESSMENT":
      return "border-indigo-400/25 bg-indigo-400/10 text-indigo-200";
    case "INTERVIEW":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
    case "OFFER":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
    default:
      return "border-rose-400/25 bg-rose-400/10 text-rose-200";
  }
}
