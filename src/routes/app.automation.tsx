import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bot, Filter, Zap } from "lucide-react";
import { AUTOMATION_AGENTS } from "@/constants/agents";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/app/automation")({
  head: () => ({ meta: [{ title: "AI Automation — Nexus" }] }),
  component: Automation,
});

function Automation() {
  const { metrics, workspace } = useWorkspace();
  const hasLogs = workspace.activity.some((e) => e.type === "integration_connected");

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Agents configured", `0 / ${AUTOMATION_AGENTS.length}`, "Available in a future phase"],
          [
            "Platforms connected",
            `${metrics.connectedPlatforms} / ${metrics.totalPlatforms}`,
            "Required for automation",
          ],
          ["Automation readiness", `${metrics.automationReadiness}%`, "Based on your workspace"],
        ].map(([l, v, s]) => (
          <div key={l} className="glass relative overflow-hidden rounded-2xl p-5">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/30 to-transparent blur-2xl" />
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">{l}</div>
            <div className="font-display mt-3 text-3xl font-semibold text-white">{v}</div>
            <div className="mt-1 text-[12px] text-white/50">{s}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="font-display text-[15px] font-semibold text-white">Agent registry</div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white"
            >
              <Filter className="h-3 w-3" /> Filter
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {AUTOMATION_AGENTS.map((a, i) => (
              <motion.div
                key={a.id}
                whileHover={{ y: -3 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-600/20 ring-1 ring-white/10">
                      <Bot className="h-4 w-4 text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-white">{a.name}</div>
                      <div className="text-[11.5px] text-white/50">{a.desc}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] text-white/50">
                    Not configured
                  </span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-0 bg-gradient-to-r from-indigo-500/30 via-cyan-400/30 to-emerald-400/30" />
                </div>
                <div className="mt-3 text-[11.5px] text-white/40">Configuration unlocks in Phase 2</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white">
            <Zap className="h-4 w-4 text-cyan-300" />
            <span className="font-display text-[15px] font-semibold">Live execution log</span>
          </div>
          {hasLogs ? (
            <div className="mt-4 max-h-[400px] space-y-2 overflow-y-auto">
              {workspace.activity.slice(0, 8).map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] text-white/90">{l.title}</div>
                    <div className="text-[11px] text-white/40">{l.subtitle}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Zap}
                title="No execution logs yet"
                description="Agent runs will be recorded here once automation is enabled in a future phase."
                actionLabel="Connect platforms"
                actionTo="/app/integrations"
                className="py-8"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
