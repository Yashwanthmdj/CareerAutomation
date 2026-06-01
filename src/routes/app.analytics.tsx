import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { TrendingUp, Target, Clock, Award } from "lucide-react";
import { StatCard } from "@/components/dashboard/AppShell";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { useWorkspace } from "@/hooks/useWorkspace";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Nexus" }] }),
  component: Analytics,
});

function Analytics() {
  const { metrics } = useWorkspace();
  const hasData = metrics.hasAutomationActivity;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Response rate"
          value={hasData ? "—" : "—"}
          hint={hasData ? undefined : "Awaiting activity"}
          icon={TrendingUp}
          accent="indigo"
        />
        <StatCard
          label="Interview rate"
          value="—"
          hint="Awaiting activity"
          icon={Target}
          accent="cyan"
        />
        <StatCard
          label="Avg time to apply"
          value="—"
          hint="Awaiting activity"
          icon={Clock}
          accent="violet"
        />
        <StatCard
          label="Offer conversion"
          value="—"
          hint="Awaiting activity"
          icon={Award}
          accent="emerald"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div whileHover={{ y: -2 }} className="glass relative overflow-hidden rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Funnel · 90 days</div>
              <div className="font-display mt-1 text-xl font-semibold text-white">Conversion velocity</div>
            </div>
            <div className="flex gap-2 text-[11px]">
              {["7d", "30d", "90d"].map((t, i) => (
                <button
                  key={t}
                  type="button"
                  disabled
                  className={`rounded-full px-2.5 py-1 ${i === 2 ? "bg-white/10 text-white/40" : "text-white/30"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <ChartPlaceholder message="Analytics will become available once automation activity begins." />
        </motion.div>

        <div className="glass rounded-2xl p-6">
          <div className="font-display text-[15px] font-semibold text-white">Funnel breakdown</div>
          <div className="mt-5 space-y-4">
            {["Sourced", "Applied", "Replied", "Interviewed", "Offers"].map((l) => (
              <div key={l}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-white/80">{l}</span>
                  <span className="text-white/40">—</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-indigo-500/30 via-cyan-400/30 to-emerald-400/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="font-display text-[15px] font-semibold text-white">Top performing channels</div>
          <p className="mt-2 text-[13px] text-white/50">
            Channel performance appears after your first automated applications.
          </p>
          <div className="mt-4 space-y-3">
            {["Direct apply", "ATS portals", "LinkedIn", "Referrals"].map((c) => (
              <div
                key={c}
                className="flex items-center justify-between rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3.5 py-2.5"
              >
                <span className="text-[13px] text-white/50">{c}</span>
                <span className="text-[12px] text-white/30">—</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="font-display text-[15px] font-semibold text-white">Company insights</div>
          <p className="mt-2 text-[13px] text-white/50">
            Match scores and interaction data will populate from real opportunity discovery.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3.5"
              >
                <div className="h-3 w-16 rounded bg-white/10" />
                <div className="mt-2 h-2 w-12 rounded bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
