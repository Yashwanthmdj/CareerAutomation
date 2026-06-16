import { apiClient } from "@/services/api/client";
import type { ScoutHistory, ScoutMetrics, ScoutRunResult, ScoutStatus } from "@/types/scout";

type ScoutSourceBreakdownApi = {
  source_name: string;
  found: number;
  ingested: number;
  duplicates: number;
};

type ScoutMetricsApi = {
  scanned_sources: number;
  opportunities_found: number;
  opportunities_ingested: number;
  duplicates_removed: number;
  last_scan_at: string | null;
  new_today: number;
  ingested_today: number;
};

type ScoutRunApi = {
  status: string;
  sources: string[];
  found: number;
  ingested: number;
  duplicates: number;
  source_breakdown: ScoutSourceBreakdownApi[];
  message?: string | null;
  duration_ms?: number | null;
};

type ScoutStatusApi = {
  status: string;
  connected_sources: string[];
  last_run_at: string | null;
  last_run_status: string | null;
  opportunities_found: number;
  opportunities_ingested: number;
  duplicates: number;
  is_running: boolean;
  source_breakdown: ScoutSourceBreakdownApi[];
  metrics: ScoutMetricsApi;
};

type ScoutHistoryItemApi = {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  sources_scanned: string[];
  opportunities_found: number;
  opportunities_ingested: number;
  duplicates_removed: number;
  trigger: string | null;
};

type ScoutHistoryApi = {
  items: ScoutHistoryItemApi[];
  total: number;
};

function mapBreakdown(row: ScoutSourceBreakdownApi) {
  return {
    sourceName: row.source_name,
    found: row.found,
    ingested: row.ingested,
    duplicates: row.duplicates,
  };
}

function mapMetrics(data: ScoutMetricsApi): ScoutMetrics {
  return {
    scannedSources: data.scanned_sources ?? 0,
    opportunitiesFound: data.opportunities_found ?? 0,
    opportunitiesIngested: data.opportunities_ingested ?? 0,
    duplicatesRemoved: data.duplicates_removed ?? 0,
    lastScanAt: data.last_scan_at,
    newToday: data.new_today ?? 0,
    ingestedToday: data.ingested_today ?? 0,
  };
}

function mapRunResult(data: ScoutRunApi): ScoutRunResult {
  return {
    status: data.status,
    sources: data.sources ?? [],
    found: data.found ?? 0,
    ingested: data.ingested ?? 0,
    duplicates: data.duplicates ?? 0,
    sourceBreakdown: (data.source_breakdown ?? []).map(mapBreakdown),
    message: data.message,
    durationMs: data.duration_ms,
  };
}

function mapStatus(data: ScoutStatusApi): ScoutStatus {
  return {
    status: data.status,
    connectedSources: data.connected_sources ?? [],
    lastRunAt: data.last_run_at,
    lastRunStatus: data.last_run_status,
    opportunitiesFound: data.opportunities_found ?? 0,
    opportunitiesIngested: data.opportunities_ingested ?? 0,
    duplicates: data.duplicates ?? 0,
    isRunning: data.is_running ?? false,
    sourceBreakdown: (data.source_breakdown ?? []).map(mapBreakdown),
    metrics: mapMetrics(data.metrics ?? ({} as ScoutMetricsApi)),
  };
}

export const scoutService = {
  async getStatus(): Promise<ScoutStatus> {
    const data = await apiClient.get<ScoutStatusApi>("/scout/status");
    return mapStatus(data);
  },

  async runAll(): Promise<ScoutRunResult> {
    const data = await apiClient.post<ScoutRunApi>("/scout/run");
    return mapRunResult(data);
  },

  async runSource(sourceName: string): Promise<ScoutRunResult> {
    const data = await apiClient.post<ScoutRunApi>(`/scout/run/${encodeURIComponent(sourceName)}`);
    return mapRunResult(data);
  },

  async getHistory(limit = 20): Promise<ScoutHistory> {
    const data = await apiClient.get<ScoutHistoryApi>(`/scout/history?limit=${limit}`);
    return {
      total: data.total ?? 0,
      items: (data.items ?? []).map((row) => ({
        id: row.id,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        durationMs: row.duration_ms,
        sourcesScanned: row.sources_scanned ?? [],
        opportunitiesFound: row.opportunities_found ?? 0,
        opportunitiesIngested: row.opportunities_ingested ?? 0,
        duplicatesRemoved: row.duplicates_removed ?? 0,
        trigger: row.trigger,
      })),
    };
  },
};
