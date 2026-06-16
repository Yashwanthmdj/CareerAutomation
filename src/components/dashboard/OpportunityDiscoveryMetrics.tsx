import { Clock3, Globe2, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { scoutService } from "@/services/scout/scoutService";
import { sourceService } from "@/services/source/sourceService";
import type { ScoutStatus } from "@/types/scout";

function formatRelativeTime(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof Globe2;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45">
        <Icon className="h-3.5 w-3.5 text-cyan-300/80" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-[11px] text-white/45">{hint}</div>
    </div>
  );
}

export function OpportunityDiscoveryMetrics() {
  const [status, setStatus] = useState<ScoutStatus | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const [healthyCount, setHealthyCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [next, sources, health] = await Promise.all([
        scoutService.getStatus(),
        sourceService.list(true),
        sourceService.getHealth(),
      ]);
      setStatus(next);
      setConnectedCount(sources.enabledCount);
      setHealthyCount(health.healthyCount);
      setTotalRecords(sources.sources.reduce((sum, row) => sum + row.recordsFetched, 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discovery metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const metrics = status?.metrics;

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-cyan-300" />
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Phase 4.1</div>
          <div className="font-display text-lg font-semibold text-white">Opportunity Discovery Metrics</div>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-white/45">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          Loading discovery metrics…
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Sources Connected"
            value={connectedCount || metrics?.scannedSources || 0}
            hint={`${healthyCount} healthy sources`}
            icon={Globe2}
          />
          <MetricTile
            label="Last Scan"
            value={formatRelativeTime(metrics?.lastScanAt ?? status?.lastRunAt ?? null)}
            hint="Most recent scout execution"
            icon={Clock3}
          />
          <MetricTile
            label="New Opportunities Today"
            value={metrics?.newToday ?? 0}
            hint="Discovered in today's scans"
            icon={TrendingUp}
          />
          <MetricTile
            label="Records Fetched"
            value={totalRecords}
            hint={`${metrics?.ingestedToday ?? 0} ingested today`}
            icon={Sparkles}
          />
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
          {error}
        </div>
      )}
    </section>
  );
}
