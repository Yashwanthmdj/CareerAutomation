import { ArrowUpRight, Briefcase, Loader2, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StatCard } from "@/components/dashboard/AppShell";
import { applicationService } from "@/services/application/applicationService";
import type { ApplicationDashboardMetrics } from "@/types/application";
import { cn } from "@/lib/utils";

function ApplicationFunnelChart({
  funnel,
}: {
  funnel: ApplicationDashboardMetrics["funnel"];
}) {
  const max = Math.max(...funnel.map((stage) => stage.count), 1);

  return (
    <div className="mt-6 space-y-3">
      {funnel.map((stage, index) => {
        const width = Math.max((stage.count / max) * 100, stage.count > 0 ? 12 : 4);
        return (
          <div key={stage.stage}>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-white/65">{stage.label}</span>
              <span className="font-medium text-white/85">{stage.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  index === funnel.length - 1
                    ? "bg-gradient-to-r from-emerald-500/70 to-cyan-400/70"
                    : "bg-gradient-to-r from-indigo-500/60 to-cyan-400/60",
                )}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ApplicationPipelinePanel() {
  const [metrics, setMetrics] = useState<ApplicationDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await applicationService.getDashboardMetrics();
      setMetrics(data);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  return (
    <section className="glass relative overflow-hidden rounded-2xl p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-500/[0.06] to-transparent" />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">Mission control</div>
          <h2 className="font-display mt-1 flex items-center gap-2 text-[16px] font-semibold text-white">
            <Briefcase className="h-4 w-4 text-cyan-300" />
            Application Pipeline
          </h2>
        </div>
        <Link
          to="/app/applications"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-cyan-200 transition hover:border-cyan-400/25 hover:bg-cyan-400/10"
        >
          Open board
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="relative mt-6 flex items-center gap-2 text-[12px] text-white/45">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          Loading pipeline metrics…
        </div>
      ) : metrics ? (
        <>
          <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Active applications"
              value={`${metrics.activeApplications}`}
              hint={`${metrics.applicationsCount} total tracked`}
              icon={Briefcase}
              accent="cyan"
            />
            <StatCard
              label="Interviews"
              value={`${metrics.interviews}`}
              hint={`${metrics.interviewRate}% interview rate`}
              icon={TrendingUp}
              accent="indigo"
            />
            <StatCard
              label="Offers"
              value={`${metrics.offers}`}
              hint={`${metrics.offerRate}% offer rate`}
              icon={TrendingUp}
              accent="emerald"
            />
            <StatCard
              label="Success rate"
              value={`${metrics.successRate}%`}
              hint={`${metrics.rejected} rejected`}
              icon={TrendingUp}
              accent="violet"
            />
          </div>

          <div className="relative mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Pipeline funnel</div>
            <ApplicationFunnelChart funnel={metrics.funnel} />
          </div>
        </>
      ) : (
        <p className="relative mt-6 text-[12px] text-white/45">
          Track your first application to unlock pipeline analytics.
        </p>
      )}
    </section>
  );
}
