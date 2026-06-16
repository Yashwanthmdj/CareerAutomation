import { apiClient } from "@/services/api/client";
import type { Opportunity, OpportunityType, SourceType } from "@/types/opportunity";
import type { Application, ApplicationDashboardMetrics, ApplicationStatus } from "@/types/application";

type OpportunityApi = {
  id: string;
  title: string;
  company: string;
  source_name: string;
  source_type: SourceType;
  description: string | null;
  apply_link: string | null;
  location: string | null;
  deadline: string | null;
  required_skills: string[];
  opportunity_type: OpportunityType;
  created_at: string;
  updated_at: string;
  is_saved: boolean;
};

type ApplicationApi = {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: ApplicationStatus;
  notes: string | null;
  applied_at: string | null;
  assessment_at: string | null;
  interview_at: string | null;
  offer_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  opportunity: OpportunityApi;
  match_score: number | null;
  match_level: string | null;
};

type ApplicationListApi = {
  applications: ApplicationApi[];
  total: number;
};

type ApplicationDashboardMetricsApi = {
  active_applications: number;
  interviews: number;
  offers: number;
  rejected: number;
  success_rate: number;
  interview_rate: number;
  offer_rate: number;
  applications_count: number;
  funnel: Array<{
    stage: ApplicationStatus;
    label: string;
    count: number;
  }>;
};

function mapOpportunity(data: OpportunityApi): Opportunity {
  return {
    id: data.id,
    title: data.title,
    company: data.company,
    sourceName: data.source_name,
    sourceType: data.source_type,
    description: data.description,
    applyLink: data.apply_link,
    location: data.location,
    deadline: data.deadline,
    requiredSkills: data.required_skills ?? [],
    opportunityType: data.opportunity_type,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isSaved: data.is_saved,
  };
}

function mapApplication(data: ApplicationApi): Application {
  return {
    id: data.id,
    userId: data.user_id,
    opportunityId: data.opportunity_id,
    status: data.status,
    notes: data.notes,
    appliedAt: data.applied_at,
    assessmentAt: data.assessment_at,
    interviewAt: data.interview_at,
    offerAt: data.offer_at,
    rejectedAt: data.rejected_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    opportunity: mapOpportunity(data.opportunity),
    matchScore: data.match_score,
    matchLevel: data.match_level,
  };
}

export const applicationService = {
  async list(): Promise<{ applications: Application[]; total: number }> {
    const data = await apiClient.get<ApplicationListApi>("/applications");
    return {
      applications: (data.applications ?? []).map(mapApplication),
      total: data.total ?? 0,
    };
  },

  async get(id: string): Promise<Application> {
    const data = await apiClient.get<ApplicationApi>(`/applications/${id}`);
    return mapApplication(data);
  },

  async create(opportunityId: string, notes?: string): Promise<Application> {
    const data = await apiClient.post<ApplicationApi>("/applications", {
      opportunity_id: opportunityId,
      notes,
    });
    return mapApplication(data);
  },

  async updateStatus(id: string, status: ApplicationStatus): Promise<Application> {
    const data = await apiClient.patch<ApplicationApi>(`/applications/${id}/status`, { status });
    return mapApplication(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/applications/${id}`);
  },

  async getDashboardMetrics(): Promise<ApplicationDashboardMetrics> {
    const data = await apiClient.get<ApplicationDashboardMetricsApi>("/applications/metrics/dashboard");
    return {
      activeApplications: data.active_applications ?? 0,
      interviews: data.interviews ?? 0,
      offers: data.offers ?? 0,
      rejected: data.rejected ?? 0,
      successRate: data.success_rate ?? 0,
      interviewRate: data.interview_rate ?? 0,
      offerRate: data.offer_rate ?? 0,
      applicationsCount: data.applications_count ?? 0,
      funnel: data.funnel ?? [],
    };
  },
};
