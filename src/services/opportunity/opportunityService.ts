import { apiClient } from "@/services/api/client";
import type { Opportunity, OpportunityCreateInput, OpportunityType, SourceType } from "@/types/opportunity";

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

type OpportunityListApi = {
  opportunities: OpportunityApi[];
  total: number;
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

export type OpportunityListParams = {
  q?: string;
  sourceType?: SourceType;
  opportunityType?: OpportunityType;
  savedOnly?: boolean;
};

type OpportunityIngestApi = {
  opportunity: OpportunityApi;
  is_duplicate: boolean;
  message: string;
};

export type OpportunityIngestResult = {
  opportunity: Opportunity;
  isDuplicate: boolean;
  message: string;
};

export const opportunityService = {
  async list(params: OpportunityListParams = {}): Promise<{ opportunities: Opportunity[]; total: number }> {
    const data = await apiClient.get<OpportunityListApi>("/opportunities", {
      q: params.q,
      source_type: params.sourceType,
      opportunity_type: params.opportunityType,
      saved_only: params.savedOnly,
    });
    return {
      opportunities: (data.opportunities ?? []).map(mapOpportunity),
      total: data.total ?? 0,
    };
  },

  async search(params: OpportunityListParams = {}): Promise<{ opportunities: Opportunity[]; total: number }> {
    const data = await apiClient.get<OpportunityListApi>("/opportunities/search", {
      q: params.q,
      source_type: params.sourceType,
      opportunity_type: params.opportunityType,
      saved_only: params.savedOnly,
    });
    return {
      opportunities: (data.opportunities ?? []).map(mapOpportunity),
      total: data.total ?? 0,
    };
  },

  async ingest(input: OpportunityCreateInput): Promise<OpportunityIngestResult> {
    const data = await apiClient.post<OpportunityIngestApi>("/opportunities/ingest", {
      title: input.title,
      company: input.company,
      source_name: input.sourceName,
      source_type: input.sourceType,
      description: input.description,
      apply_link: input.applyLink,
      location: input.location,
      deadline: input.deadline || undefined,
      required_skills: input.requiredSkills,
      opportunity_type: input.opportunityType,
    });
    return {
      opportunity: mapOpportunity(data.opportunity),
      isDuplicate: data.is_duplicate,
      message: data.message,
    };
  },

  async get(id: string): Promise<Opportunity> {
    const data = await apiClient.get<OpportunityApi>(`/opportunities/${id}`);
    return mapOpportunity(data);
  },

  async create(input: OpportunityCreateInput): Promise<Opportunity> {
    const data = await apiClient.post<OpportunityApi>("/opportunities", {
      title: input.title,
      company: input.company,
      source_name: input.sourceName,
      source_type: input.sourceType,
      description: input.description,
      apply_link: input.applyLink,
      location: input.location,
      deadline: input.deadline || undefined,
      required_skills: input.requiredSkills,
      opportunity_type: input.opportunityType,
    });
    return mapOpportunity(data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/opportunities/${id}`);
  },

  async save(id: string): Promise<void> {
    await apiClient.post(`/opportunities/${id}/save`);
  },

  async unsave(id: string): Promise<void> {
    await apiClient.delete(`/opportunities/${id}/save`);
  },
};
