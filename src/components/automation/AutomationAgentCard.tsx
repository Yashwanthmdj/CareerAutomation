import { Bot, Clock3, Gauge } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AutomationAgent } from "@/types/automation";
import { agentStatusBadgeClass, agentStatusLabel } from "@/types/automation";
import type { ScoutStatus } from "@/types/scout";

type Props = {
  agent: AutomationAgent;
  pending?: boolean;
  scoutStatus?: ScoutStatus | null;
  onToggle: (agent: AutomationAgent, enabled: boolean) => void;
  onOpen: (agent: AutomationAgent) => void;
};

function formatLastRun(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatScoutLastScan(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function AutomationAgentCard({ agent, pending = false, scoutStatus = null, onToggle, onOpen }: Props) {
  const isScout = agent.agentType === "OPPORTUNITY_SCOUT";
  return (
    <button
      type="button"
      onClick={() => onOpen(agent)}
      className={cn(
        "group w-full overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] p-4 text-left",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.04]",
        "hover:shadow-[0_18px_42px_-24px_rgba(99,102,241,0.32)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-600/20 ring-1 ring-white/10">
            <Bot className="h-4 w-4 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium text-white">{agent.name}</div>
            <div className="mt-0.5 line-clamp-2 text-[11.5px] text-white/50">{agent.description}</div>
          </div>
        </div>
        <div
          className="shrink-0"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Switch
            checked={agent.enabled}
            disabled={pending}
            onCheckedChange={(checked) => onToggle(agent, checked)}
            aria-label={`${agent.enabled ? "Disable" : "Enable"} ${agent.name}`}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]",
            agentStatusBadgeClass(agent.status),
          )}
        >
          {agentStatusLabel(agent.status)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/55">
          <Gauge className="h-3 w-3" />
          {agent.successRate}% success
        </span>
      </div>

      {isScout && scoutStatus ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-white/45">
          <div className="rounded-lg border border-white/8 bg-black/10 px-2.5 py-2">
            <div className="uppercase tracking-[0.1em]">Last Scan</div>
            <div className="mt-1 truncate text-[12px] font-medium text-white/80">
              {formatScoutLastScan(scoutStatus.metrics.lastScanAt ?? scoutStatus.lastRunAt)}
            </div>
          </div>
          <div className="rounded-lg border border-white/8 bg-black/10 px-2.5 py-2">
            <div className="uppercase tracking-[0.1em]">Sources Connected</div>
            <div className="mt-1 text-[12px] font-medium text-white/80">
              {scoutStatus.metrics.scannedSources ?? scoutStatus.connectedSources.length}
            </div>
          </div>
          <div className="rounded-lg border border-white/8 bg-black/10 px-2.5 py-2">
            <div className="uppercase tracking-[0.1em]">Opportunities Found</div>
            <div className="mt-1 text-[12px] font-medium text-white/80">
              {scoutStatus.metrics.opportunitiesFound ?? scoutStatus.opportunitiesFound}
            </div>
          </div>
          <div className="rounded-lg border border-white/8 bg-black/10 px-2.5 py-2">
            <div className="uppercase tracking-[0.1em]">Duplicates Removed</div>
            <div className="mt-1 text-[12px] font-medium text-white/80">
              {scoutStatus.metrics.duplicatesRemoved ?? scoutStatus.duplicates}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-white/45">
          <div className="rounded-lg border border-white/8 bg-black/10 px-2.5 py-2">
            <div className="uppercase tracking-[0.1em]">Runs</div>
            <div className="mt-1 text-[12px] font-medium text-white/80">{agent.totalRuns}</div>
          </div>
          <div className="rounded-lg border border-white/8 bg-black/10 px-2.5 py-2">
            <div className="flex items-center gap-1 uppercase tracking-[0.1em]">
              <Clock3 className="h-3 w-3" />
              Last run
            </div>
            <div className="mt-1 truncate text-[12px] font-medium text-white/80">{formatLastRun(agent.lastRunAt)}</div>
          </div>
        </div>
      )}
    </button>
  );
}
