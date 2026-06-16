import {
  Activity,
  Building2,
  Clock3,
  Globe2,
  GraduationCap,
  Loader2,
  Rocket,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { sourceService } from "@/services/source/sourceService";
import type { OpportunitySource, SourceHealthItem } from "@/types/source";
import { healthStatusBadgeClass } from "@/types/source";

function formatRelativeTime(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function connectorIcon(kind: OpportunitySource["connectorKind"]) {
  switch (kind) {
    case "CAREER_PAGE":
      return Building2;
    case "STARTUP_JOBS":
      return Rocket;
    case "COMMUNITY":
      return GraduationCap;
    default:
      return Globe2;
  }
}

type SourceRow = OpportunitySource & { health?: SourceHealthItem };

function SourceCard({ source }: { source: SourceRow }) {
  const Icon = connectorIcon(source.connectorKind);
  const health = source.health;

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/20">
            <Icon className="h-4 w-4 text-white/80" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-white">{source.sourceName}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-white/40">
              {source.connectorKind.replace("_", " ")}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]",
            healthStatusBadgeClass(health?.healthStatus ?? source.healthStatus),
          )}
        >
          {health?.healthStatus ?? source.healthStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-white/45">
        <div className="rounded-lg border border-white/8 bg-black/10 px-2.5 py-2">
          <div className="flex items-center gap-1 uppercase tracking-[0.1em]">
            <Clock3 className="h-3 w-3" />
            Last Sync
          </div>
          <div className="mt-1 text-[12px] font-medium text-white/80">
            {formatRelativeTime(source.lastSync)}
          </div>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/10 px-2.5 py-2">
          <div className="uppercase tracking-[0.1em]">Records Fetched</div>
          <div className="mt-1 text-[12px] font-medium text-white/80">{source.recordsFetched}</div>
        </div>
      </div>

      {health?.message && (
        <div className="mt-3 text-[11px] text-white/45">{health.message}</div>
      )}
    </div>
  );
}

export function ConnectedSourcesPanel() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listResult, healthResult] = await Promise.all([
        sourceService.list(true),
        sourceService.getHealth(),
      ]);
      const healthById = new Map(healthResult.items.map((item) => [item.sourceId, item]));
      setSources(
        listResult.sources.map((source) => ({
          ...source,
          health: healthById.get(source.sourceId),
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load connected sources");
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const healthyCount = useMemo(
    () => sources.filter((s) => (s.health?.healthStatus ?? s.healthStatus) === "HEALTHY").length,
    [sources],
  );

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-300" />
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Phase 4.1</div>
            <div className="font-display text-lg font-semibold text-white">Connected Sources</div>
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/60">
          {healthyCount} / {sources.length} healthy
        </div>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-white/45">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          Loading source registry…
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sources.map((source) => (
            <SourceCard key={source.sourceId} source={source} />
          ))}
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
