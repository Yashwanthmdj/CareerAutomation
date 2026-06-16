import { apiClient } from "@/services/api/client";
import type {
  AutomationAgent,
  AutomationExecution,
  AutomationRegistryMetrics,
  AgentStatus,
  AgentType,
  ExecutionStatus,
} from "@/types/automation";

type AutomationExecutionApi = {
  id: string;
  agent_id: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  details_json: Record<string, unknown>;
};

type AutomationAgentApi = {
  id: string;
  name: string;
  agent_type: AgentType;
  description: string;
  enabled: boolean;
  status: AgentStatus;
  success_rate: number;
  last_run_at: string | null;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  configuration_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  recent_executions?: AutomationExecutionApi[];
};

type AutomationAgentListApi = {
  agents: AutomationAgentApi[];
  total: number;
};

type AutomationRegistryMetricsApi = {
  total_agents: number;
  enabled_agents: number;
  running_agents: number;
  ready_agents: number;
  registry_health: number;
};

type AutomationAgentActionApi = {
  message: string;
  agent: AutomationAgentApi;
};

function mapExecution(data: AutomationExecutionApi): AutomationExecution {
  return {
    id: data.id,
    agentId: data.agent_id,
    status: data.status,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    durationMs: data.duration_ms,
    detailsJson: data.details_json ?? {},
  };
}

function mapAgent(data: AutomationAgentApi): AutomationAgent {
  return {
    id: data.id,
    name: data.name,
    agentType: data.agent_type,
    description: data.description,
    enabled: data.enabled,
    status: data.status,
    successRate: data.success_rate ?? 0,
    lastRunAt: data.last_run_at,
    totalRuns: data.total_runs ?? 0,
    successfulRuns: data.successful_runs ?? 0,
    failedRuns: data.failed_runs ?? 0,
    configurationJson: data.configuration_json ?? {},
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    recentExecutions: (data.recent_executions ?? []).map(mapExecution),
  };
}

export const automationService = {
  async list(): Promise<{ agents: AutomationAgent[]; total: number }> {
    const data = await apiClient.get<AutomationAgentListApi>("/automations");
    return {
      agents: (data.agents ?? []).map(mapAgent),
      total: data.total ?? 0,
    };
  },

  async get(id: string): Promise<AutomationAgent> {
    const data = await apiClient.get<AutomationAgentApi>(`/automations/${id}`);
    return mapAgent(data);
  },

  async update(
    id: string,
    payload: { description?: string; configurationJson?: Record<string, unknown>; status?: AgentStatus },
  ): Promise<AutomationAgent> {
    const data = await apiClient.patch<AutomationAgentApi>(`/automations/${id}`, {
      description: payload.description,
      configuration_json: payload.configurationJson,
      status: payload.status,
    });
    return mapAgent(data);
  },

  async enable(id: string): Promise<AutomationAgent> {
    const data = await apiClient.post<AutomationAgentActionApi>(`/automations/${id}/enable`);
    return mapAgent(data.agent);
  },

  async disable(id: string): Promise<AutomationAgent> {
    const data = await apiClient.post<AutomationAgentActionApi>(`/automations/${id}/disable`);
    return mapAgent(data.agent);
  },

  async getRegistryMetrics(): Promise<AutomationRegistryMetrics> {
    const data = await apiClient.get<AutomationRegistryMetricsApi>("/automations/metrics/registry");
    return {
      totalAgents: data.total_agents ?? 0,
      enabledAgents: data.enabled_agents ?? 0,
      runningAgents: data.running_agents ?? 0,
      readyAgents: data.ready_agents ?? 0,
      registryHealth: data.registry_health ?? 0,
    };
  },
};
