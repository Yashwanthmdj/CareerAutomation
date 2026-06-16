import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bot, Loader2, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AutomationAgentCard } from "@/components/automation/AutomationAgentCard";
import { AutomationAgentDrawer } from "@/components/automation/AutomationAgentDrawer";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { automationService } from "@/services/automation/automationService";
import { scoutService } from "@/services/scout/scoutService";
import type { AutomationAgent, AutomationRegistryMetrics } from "@/types/automation";
import type { ScoutStatus } from "@/types/scout";

export const Route = createFileRoute("/app/automation")({
  head: () => ({ meta: [{ title: "AI Automation — Nexus" }] }),
  component: Automation,
});

function Automation() {
  const [agents, setAgents] = useState<AutomationAgent[]>([]);
  const [metrics, setMetrics] = useState<AutomationRegistryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AutomationAgent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [scoutStatus, setScoutStatus] = useState<ScoutStatus | null>(null);

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentResult, metricResult, scoutResult] = await Promise.all([
        automationService.list(),
        automationService.getRegistryMetrics(),
        scoutService.getStatus().catch(() => null),
      ]);
      setAgents(agentResult.agents);
      setMetrics(metricResult);
      setScoutStatus(scoutResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load automation registry");
      setAgents([]);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistry();
  }, [loadRegistry]);

  const handleToggle = async (agent: AutomationAgent, enabled: boolean) => {
    setPendingId(agent.id);
    setError(null);
    try {
      const updated = enabled ? await automationService.enable(agent.id) : await automationService.disable(agent.id);
      setAgents((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      if (selectedAgent?.id === updated.id) setSelectedAgent(updated);
      const metricResult = await automationService.getRegistryMetrics();
      setMetrics(metricResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update agent");
    } finally {
      setPendingId(null);
    }
  };

  const handleOpenAgent = async (agent: AutomationAgent) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setSelectedAgent(agent);
    try {
      const detailed = await automationService.get(agent.id);
      setSelectedAgent(detailed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agent details");
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Agents enabled", `${metrics?.enabledAgents ?? 0} / ${metrics?.totalAgents ?? 0}`, "Registry orchestration"],
          ["Ready agents", `${metrics?.readyAgents ?? 0}`, "Configured and available"],
          ["Registry health", `${metrics?.registryHealth ?? 0}%`, "Ready vs enabled agents"],
        ].map(([label, value, hint]) => (
          <div key={label} className="glass relative overflow-hidden rounded-2xl p-5">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/30 to-transparent blur-2xl" />
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">{label}</div>
            <div className="font-display mt-3 text-3xl font-semibold text-white">{value}</div>
            <div className="mt-1 text-[12px] text-white/50">{hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Phase 3.9</div>
              <div className="font-display text-[15px] font-semibold text-white">Agent registry</div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
              Loading agents…
            </div>
          ) : agents.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Bot}
                title="No agents in registry"
                description="Restart the backend to seed the default automation agents."
                className="py-8"
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <AutomationAgentCard
                    agent={agent}
                    pending={pendingId === agent.id}
                    scoutStatus={agent.agentType === "OPPORTUNITY_SCOUT" ? scoutStatus : null}
                    onToggle={(row, enabled) => void handleToggle(row, enabled)}
                    onOpen={(row) => void handleOpenAgent(row)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white">
            <Zap className="h-4 w-4 text-cyan-300" />
            <span className="font-display text-[15px] font-semibold">Execution history</span>
          </div>
          {agents.some((agent) => agent.totalRuns > 0) ? (
            <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">
              {agents
                .flatMap((agent) =>
                  agent.recentExecutions.map((execution) => ({
                    agentName: agent.name,
                    ...execution,
                  })),
                )
                .slice(0, 10)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] text-white/90">{entry.agentName}</div>
                      <div className="text-[11px] text-white/40">
                        {entry.status} · {entry.durationMs != null ? `${entry.durationMs} ms` : "pending"}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Zap}
                title="No execution logs yet"
                description="Execution history will appear here once automation runs are recorded in future phases."
                className="py-8"
              />
            </div>
          )}
        </div>
      </div>

      <AutomationAgentDrawer
        agent={selectedAgent}
        open={drawerOpen}
        loading={drawerLoading}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
