import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PLATFORMS } from "@/constants/integrations";
import { useWorkspace } from "@/hooks/useWorkspace";

export const Route = createFileRoute("/app/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Nexus" }] }),
  component: Integrations,
});

function Integrations() {
  const { workspace, setIntegrationConnected, metrics } = useWorkspace();

  return (
    <>
      <div className="glass mb-6 rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Connection status</div>
        <div className="mt-2 font-display text-xl font-semibold text-white">
          {metrics.connectedPlatforms} of {metrics.totalPlatforms} platforms connected
        </div>
        <p className="mt-2 max-w-2xl text-[13px] text-white/55">
          Toggle connections to track your workspace state. Live OAuth sync arrives in Phase 2 — no credentials are
          stored in Phase 1.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLATFORMS.map((platform, i) => {
          const connection = workspace.integrations.find((x) => x.id === platform.id);
          const connected = connection?.connected ?? false;

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass group relative overflow-hidden rounded-2xl p-5 transition-all hover:shadow-[0_30px_80px_-30px_rgba(99,102,241,0.45)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] ring-1 ring-white/10">
                    <platform.icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="font-display text-[15px] font-semibold text-white">{platform.name}</div>
                    <div
                      className={`text-[11px] uppercase tracking-[0.16em] ${
                        connected ? "text-emerald-300" : "text-white/40"
                      }`}
                    >
                      {connected ? "Connected" : "Not connected"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIntegrationConnected(platform.id, !connected)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors ${
                    connected
                      ? "border border-white/10 bg-white/[0.06] text-white/70 hover:text-white"
                      : "bg-gradient-to-b from-indigo-500 to-violet-600 text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.7)]"
                  }`}
                >
                  {connected ? "Disconnect" : "Connect"}
                </button>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-white/55">{platform.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
