import { apiClient } from "@/services/api/client";
import type {
  ConnectorKind,
  HealthStatus,
  OpportunitySourceList,
  SourceHealth,
  SourceSyncResult,
} from "@/types/source";

type OpportunitySourceApi = {
  source_id: string;
  source_name: string;
  connector_kind: ConnectorKind;
  source_type: string;
  enabled: boolean;
  health_status: HealthStatus;
  last_sync: string | null;
  records_fetched: number;
  feed_url: string | null;
};

type OpportunitySourceListApi = {
  sources: OpportunitySourceApi[];
  total: number;
  enabled_count: number;
};

type SourceHealthItemApi = {
  source_id: string;
  source_name: string;
  health_status: HealthStatus;
  message: string;
  latency_ms: number | null;
  last_sync: string | null;
  records_fetched: number;
  enabled: boolean;
};

type SourceHealthApi = {
  items: SourceHealthItemApi[];
  healthy_count: number;
  degraded_count: number;
  unhealthy_count: number;
  unknown_count: number;
};

type SourceSyncApi = {
  source_id: string;
  source_name: string;
  status: string;
  found: number;
  ingested: number;
  duplicates: number;
  records_fetched: number;
  health_status: HealthStatus;
  last_sync: string | null;
  duration_ms: number | null;
  message?: string | null;
};

function mapSource(row: OpportunitySourceApi) {
  return {
    sourceId: row.source_id,
    sourceName: row.source_name,
    connectorKind: row.connector_kind,
    sourceType: row.source_type,
    enabled: row.enabled,
    healthStatus: row.health_status,
    lastSync: row.last_sync,
    recordsFetched: row.records_fetched,
    feedUrl: row.feed_url,
  };
}

export const sourceService = {
  async list(enabledOnly = false): Promise<OpportunitySourceList> {
    const query = enabledOnly ? "?enabled_only=true" : "";
    const data = await apiClient.get<OpportunitySourceListApi>(`/sources${query}`);
    return {
      total: data.total ?? 0,
      enabledCount: data.enabled_count ?? 0,
      sources: (data.sources ?? []).map(mapSource),
    };
  },

  async getHealth(): Promise<SourceHealth> {
    const data = await apiClient.get<SourceHealthApi>("/sources/health");
    return {
      healthyCount: data.healthy_count ?? 0,
      degradedCount: data.degraded_count ?? 0,
      unhealthyCount: data.unhealthy_count ?? 0,
      unknownCount: data.unknown_count ?? 0,
      items: (data.items ?? []).map((row) => ({
        sourceId: row.source_id,
        sourceName: row.source_name,
        healthStatus: row.health_status,
        message: row.message,
        latencyMs: row.latency_ms,
        lastSync: row.last_sync,
        recordsFetched: row.records_fetched,
        enabled: row.enabled,
      })),
    };
  },

  async sync(sourceId: string): Promise<SourceSyncResult> {
    const data = await apiClient.post<SourceSyncApi>(`/sources/${encodeURIComponent(sourceId)}/sync`);
    return {
      sourceId: data.source_id,
      sourceName: data.source_name,
      status: data.status,
      found: data.found ?? 0,
      ingested: data.ingested ?? 0,
      duplicates: data.duplicates ?? 0,
      recordsFetched: data.records_fetched ?? 0,
      healthStatus: data.health_status,
      lastSync: data.last_sync,
      durationMs: data.duration_ms,
      message: data.message ?? null,
    };
  },
};
