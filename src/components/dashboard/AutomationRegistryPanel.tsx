import { ArrowUpRight, Bot, Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StatCard } from "@/components/dashboard/AppShell";
import { automationService } from "@/services/automation/automationService";
import type { AutomationRegistryMetrics } from "@/types/automation";

export function AutomationRegistryPanel() {
  const [metrics, setMetrics] = useState<AutomationRegistryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await automationService.getRegistryMetrics();
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-500/[0.07] to-transparent" />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">Mission control</div>
          <h2 className="font-display mt-1 flex items-center gap-2 text-[16px] font-semibold text-white">
            <Bot className="h-4 w-4 text-cyan-300" />
            Automation Registry
          </h2>
        </div>
        <Link
          to="/app/automation"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-cyan-200 transition hover:border-cyan-400/25 hover:bg-cyan-400/10"
        >
          Open registry
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="relative mt-6 flex items-center gap-2 text-[12px] text-white/45">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          Loading registry metrics…
        </div>
      ) : metrics ? (
        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total agents"
            value={`${metrics.totalAgents}`}
            hint="Seeded automation registry"
            icon={Bot}
            accent="indigo"
          />
          <StatCard
            label="Enabled"
            value={`${metrics.enabledAgents}`}
            hint="Active in orchestration layer"
            icon={ShieldCheck}
            accent="cyan"
          />
          <StatCard
            label="Ready"
            value={`${metrics.readyAgents}`}
            hint={`${metrics.runningAgents} running`}
            icon={ShieldCheck}
            accent="emerald"
          />
          <StatCard
            label="Registry health"
            value={`${metrics.registryHealth}%`}
            hint="Ready agents / enabled agents"
            icon={ShieldCheck}
            accent="violet"
          />
        </div>
      ) : (
        <p className="relative mt-6 text-[12px] text-white/45">
          Automation registry metrics will appear after backend seeding completes.
        </p>
      )}
    </section>
  );
}
