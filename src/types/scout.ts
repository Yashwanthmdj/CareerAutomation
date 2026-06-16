export type ScoutSourceBreakdown = {
  sourceName: string;
  found: number;
  ingested: number;
  duplicates: number;
};

export type ScoutMetrics = {
  scannedSources: number;
  opportunitiesFound: number;
  opportunitiesIngested: number;
  duplicatesRemoved: number;
  lastScanAt: string | null;
  newToday: number;
  ingestedToday: number;
};

export type ScoutRunResult = {
  status: string;
  sources: string[];
  found: number;
  ingested: number;
  duplicates: number;
  sourceBreakdown: ScoutSourceBreakdown[];
  message?: string | null;
  durationMs?: number | null;
};

export type ScoutStatus = {
  status: string;
  connectedSources: string[];
  lastRunAt: string | null;
  lastRunStatus: string | null;
  opportunitiesFound: number;
  opportunitiesIngested: number;
  duplicates: number;
  isRunning: boolean;
  sourceBreakdown: ScoutSourceBreakdown[];
  metrics: ScoutMetrics;
};

export type ScoutHistoryItem = {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  sourcesScanned: string[];
  opportunitiesFound: number;
  opportunitiesIngested: number;
  duplicatesRemoved: number;
  trigger: string | null;
};

export type ScoutHistory = {
  items: ScoutHistoryItem[];
  total: number;
};
