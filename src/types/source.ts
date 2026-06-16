export type ConnectorKind = "CAREER_PAGE" | "STARTUP_JOBS" | "COMMUNITY";

export type HealthStatus = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNKNOWN";

export type OpportunitySource = {
  sourceId: string;
  sourceName: string;
  connectorKind: ConnectorKind;
  sourceType: string;
  enabled: boolean;
  healthStatus: HealthStatus;
  lastSync: string | null;
  recordsFetched: number;
  feedUrl: string | null;
};

export type OpportunitySourceList = {
  sources: OpportunitySource[];
  total: number;
  enabledCount: number;
};

export type SourceHealthItem = {
  sourceId: string;
  sourceName: string;
  healthStatus: HealthStatus;
  message: string;
  latencyMs: number | null;
  lastSync: string | null;
  recordsFetched: number;
  enabled: boolean;
};

export type SourceHealth = {
  items: SourceHealthItem[];
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  unknownCount: number;
};

export type SourceSyncResult = {
  sourceId: string;
  sourceName: string;
  status: string;
  found: number;
  ingested: number;
  duplicates: number;
  recordsFetched: number;
  healthStatus: HealthStatus;
  lastSync: string | null;
  durationMs: number | null;
  message: string | null;
};

export function healthStatusBadgeClass(status: HealthStatus): string {
  switch (status) {
    case "HEALTHY":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
    case "DEGRADED":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
    case "UNHEALTHY":
      return "border-rose-400/25 bg-rose-400/10 text-rose-200";
    default:
      return "border-white/10 bg-white/5 text-white/45";
  }
}
