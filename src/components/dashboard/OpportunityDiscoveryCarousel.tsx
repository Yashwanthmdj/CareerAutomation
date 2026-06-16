import { Building2, ChevronLeft, ChevronRight, Globe2, GraduationCap, Loader2, Rocket, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { scoutService } from "@/services/scout/scoutService";
import { sourceService } from "@/services/source/sourceService";
import type { ScoutSourceBreakdown, ScoutStatus } from "@/types/scout";
import type { OpportunitySource } from "@/types/source";

type Props = {
  onRunComplete?: () => void;
};

type SourceMeta = {
  name: string;
  icon: typeof Globe2;
  accent: string;
};

const SOURCE_META: Record<string, SourceMeta> = {
  "Google Careers": { name: "Google Careers", icon: Globe2, accent: "from-sky-500/20 to-cyan-500/10" },
  "Microsoft Careers": { name: "Microsoft Careers", icon: Building2, accent: "from-blue-500/20 to-indigo-500/10" },
  "Amazon Jobs": { name: "Amazon Jobs", icon: Building2, accent: "from-amber-500/20 to-orange-500/10" },
  "Y Combinator Jobs": { name: "Y Combinator Jobs", icon: Rocket, accent: "from-violet-500/20 to-indigo-500/10" },
  Wellfound: { name: "Wellfound", icon: Trophy, accent: "from-emerald-500/20 to-teal-500/10" },
  "Student Tribe": { name: "Student Tribe", icon: GraduationCap, accent: "from-amber-500/20 to-orange-500/10" },
  "T-Hub": { name: "T-Hub", icon: GraduationCap, accent: "from-rose-500/20 to-pink-500/10" },
};

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

function buildSourceRows(
  status: ScoutStatus | null,
  registry: OpportunitySource[],
): Array<ScoutSourceBreakdown & { active: boolean }> {
  const breakdownByName = new Map(
    (status?.sourceBreakdown ?? []).map((row) => [row.sourceName, row]),
  );

  const names = registry.length
    ? registry.map((row) => row.sourceName)
    : status?.connectedSources ?? [];

  return names.map((sourceName) => {
    const row = breakdownByName.get(sourceName);
    const registryRow = registry.find((item) => item.sourceName === sourceName);
    return {
      sourceName,
      found: row?.found ?? registryRow?.recordsFetched ?? 0,
      ingested: row?.ingested ?? 0,
      duplicates: row?.duplicates ?? 0,
      active: registryRow?.enabled ?? true,
    };
  });
}

function SummaryPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur-sm">
      <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">{label}</span>
      <span className="ml-2 text-[13px] font-semibold text-white">{value}</span>
    </div>
  );
}

function SourceDiscoveryCard({
  source,
  lastScanAt,
}: {
  source: ScoutSourceBreakdown & { active: boolean };
  lastScanAt: string | null;
}) {
  const meta = SOURCE_META[source.sourceName] ?? {
    name: source.sourceName,
    icon: Globe2,
    accent: "from-white/10 to-white/5",
  };
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.8)] transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05] hover:shadow-[0_24px_60px_-24px_rgba(99,102,241,0.35)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
          meta.accent,
        )}
      />
      <div className="relative flex h-full min-h-[168px] flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20">
              <Icon className="h-4 w-4 text-white/85" />
            </div>
            <div>
              <div className="font-display text-[15px] font-semibold text-white">{meta.name}</div>
              <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/55">
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    source.active ? "bg-emerald-400" : "bg-white/30",
                  )}
                />
                {source.active ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]",
              source.active
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                : "border-white/10 bg-white/5 text-white/45",
            )}
          >
            {source.active ? "Live" : "Idle"}
          </span>
        </div>

        <div className="mt-5">
          <div className="text-[28px] font-semibold leading-none text-white">{source.found}</div>
          <div className="mt-1 text-[12px] text-white/55">Opportunities Found</div>
        </div>

        <div className="mt-5 border-t border-white/8 pt-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-white/40">Last Scan</div>
          <div className="mt-1 text-[12.5px] text-white/75">{formatRelativeTime(lastScanAt)}</div>
        </div>
      </div>
    </div>
  );
}

export function OpportunityDiscoveryCarousel({ onRunComplete }: Props) {
  const [status, setStatus] = useState<ScoutStatus | null>(null);
  const [registry, setRegistry] = useState<OpportunitySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [next, sources] = await Promise.all([
        scoutService.getStatus(),
        sourceService.list(true),
      ]);
      setStatus(next);
      setRegistry(sources.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discovery status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setSelectedIndex(carouselApi.selectedScrollSnap());
    };

    setSnapCount(carouselApi.scrollSnapList().length);
    onSelect();
    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
      carouselApi.off("reInit", onSelect);
    };
  }, [carouselApi]);

  const sourceRows = useMemo(() => buildSourceRows(status, registry), [status, registry]);

  const newToday = useMemo(() => status?.metrics.newToday ?? 0, [status]);
  const ingestedToday = useMemo(() => status?.metrics.ingestedToday ?? 0, [status]);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await scoutService.runAll();
      setSuccessMessage(`${result.found} Opportunities Discovered`);
      await loadStatus();
      onRunComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scout run failed");
    } finally {
      setRunning(false);
    }
  };

  const scrollPrev = () => carouselApi?.scrollPrev();
  const scrollNext = () => carouselApi?.scrollNext();

  return (
    <section className="glass relative overflow-hidden rounded-2xl p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-500/[0.08] to-transparent" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
            <span aria-hidden>🚀</span>
            <span className="font-display text-lg">Opportunity Discovery</span>
          </div>
          <p className="mt-1 max-w-xl text-[13px] text-white/55">
            Live opportunity discovery across connected sources.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <button
            type="button"
            onClick={() => void handleRun()}
            disabled={running || status?.isRunning}
            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_-12px_rgba(99,102,241,0.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Run Scout
          </button>
          {running && (
            <span className="text-[12px] text-cyan-200/90">Scanning Sources...</span>
          )}
          {!running && successMessage && (
            <span className="text-[12px] font-medium text-emerald-300">{successMessage}</span>
          )}
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <SummaryPill label="New Today" value={newToday} />
        <SummaryPill label="Active Sources" value={status?.metrics.scannedSources ?? status?.connectedSources.length ?? 0} />
        <SummaryPill label="Ingested Today" value={ingestedToday} />
        <SummaryPill label="Duplicates Removed" value={status?.metrics.duplicatesRemoved ?? status?.duplicates ?? 0} />
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-[12px] text-white/45">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          Loading discovery sources…
        </div>
      ) : (
        <div className="relative mt-6">
          <Carousel
            setApi={setCarouselApi}
            opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}
            className="w-full"
          >
            <CarouselContent className="-ml-3 md:-ml-4">
              {sourceRows.map((source) => (
                <CarouselItem
                  key={source.sourceName}
                  className="basis-[88%] pl-3 sm:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                >
                  <SourceDiscoveryCard source={source} lastScanAt={status?.lastRunAt ?? null} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={scrollPrev}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                aria-label="Previous sources"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                aria-label="Next sources"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: snapCount || sourceRows.length }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => carouselApi?.scrollTo(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    selectedIndex === index ? "w-5 bg-cyan-300/80" : "w-1.5 bg-white/20",
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
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
