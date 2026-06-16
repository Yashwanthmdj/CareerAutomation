export type AgentType =
  | "APPLY_AGENT"
  | "EMAIL_AGENT"
  | "FORM_AGENT"
  | "OPPORTUNITY_SCOUT";

export type AgentStatus =
  | "NOT_CONFIGURED"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "ERROR";

export type ExecutionStatus = "RUNNING" | "SUCCESS" | "FAILED";

export type AutomationExecution = {
  id: string;
  agentId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  detailsJson: Record<string, unknown>;
};

export type AutomationAgent = {
  id: string;
  name: string;
  agentType: AgentType;
  description: string;
  enabled: boolean;
  status: AgentStatus;
  successRate: number;
  lastRunAt: string | null;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  configurationJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  recentExecutions: AutomationExecution[];
};

export type AutomationRegistryMetrics = {
  totalAgents: number;
  enabledAgents: number;
  runningAgents: number;
  readyAgents: number;
  registryHealth: number;
};

export function agentStatusLabel(status: AgentStatus): string {
  return status.replace(/_/g, " ");
}

export function agentStatusBadgeClass(status: AgentStatus): string {
  switch (status) {
    case "READY":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
    case "RUNNING":
      return "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";
    case "PAUSED":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
    case "ERROR":
      return "border-rose-400/25 bg-rose-400/10 text-rose-200";
    default:
      return "border-white/10 bg-white/5 text-white/45";
  }
}
