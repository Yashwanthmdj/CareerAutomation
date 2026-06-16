import { Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { AutomationAgent } from "@/types/automation";
import { agentStatusBadgeClass, agentStatusLabel } from "@/types/automation";

type Props = {
  agent: AutomationAgent | null;
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function AutomationAgentDrawer({ agent, open, loading = false, onOpenChange }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-white/10 bg-[#0b1020] text-white">
        {loading || !agent ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
            Loading agent details…
          </div>
        ) : (
          <div className="mx-auto w-full max-w-2xl px-4 pb-8">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle className="font-display text-xl text-white">{agent.name}</DrawerTitle>
              <DrawerDescription className="text-white/55">{agent.description}</DrawerDescription>
            </DrawerHeader>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Status</div>
                <span
                  className={cn(
                    "mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]",
                    agentStatusBadgeClass(agent.status),
                  )}
                >
                  {agentStatusLabel(agent.status)}
                </span>
                <div className="mt-3 text-[12px] text-white/55">
                  {agent.enabled ? "Enabled in registry" : "Disabled in registry"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Execution statistics</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <div className="text-white/45">Total runs</div>
                    <div className="font-medium text-white">{agent.totalRuns}</div>
                  </div>
                  <div>
                    <div className="text-white/45">Success rate</div>
                    <div className="font-medium text-emerald-300">{agent.successRate}%</div>
                  </div>
                  <div>
                    <div className="text-white/45">Successful</div>
                    <div className="font-medium text-white">{agent.successfulRuns}</div>
                  </div>
                  <div>
                    <div className="text-white/45">Failed</div>
                    <div className="font-medium text-rose-300">{agent.failedRuns}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Configuration</div>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-white/8 bg-black/20 p-3 text-[11px] text-cyan-100/90">
                {JSON.stringify(agent.configurationJson, null, 2)}
              </pre>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Recent executions</div>
              {agent.recentExecutions.length === 0 ? (
                <p className="mt-3 text-[12px] text-white/45">No executions recorded yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {agent.recentExecutions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between rounded-lg border border-white/8 bg-black/15 px-3 py-2.5"
                    >
                      <div>
                        <div className="text-[12px] font-medium text-white/85">{execution.status}</div>
                        <div className="text-[11px] text-white/45">{formatTimestamp(execution.startedAt)}</div>
                      </div>
                      <div className="text-right text-[11px] text-white/45">
                        {execution.durationMs != null ? `${execution.durationMs} ms` : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
