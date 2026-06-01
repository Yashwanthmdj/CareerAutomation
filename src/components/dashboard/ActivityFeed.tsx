import { motion } from "motion/react";
import { Activity, Circle } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState } from "./EmptyState";

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const accentByType: Record<string, string> = {
  profile_updated: "text-indigo-300",
  integration_connected: "text-emerald-300",
  integration_disconnected: "text-white/40",
  resume_uploaded: "text-cyan-300",
  career_goals_configured: "text-violet-300",
};

export function ActivityFeed({ className = "" }: { className?: string }) {
  const { workspace } = useWorkspace();
  const events = workspace.activity;

  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-2 text-white">
        <Activity className="h-4 w-4 text-cyan-300" />
        <span className="font-display text-[15px] font-semibold">Live agent feed</span>
      </div>

      {events.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Activity}
            title="No events yet"
            description="Profile updates, connections, and resume uploads will appear here as you configure your workspace."
            actionLabel="Complete profile"
            actionTo="/app/profile"
            className="py-8"
          />
        </div>
      ) : (
        <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
          {events.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3"
            >
              <div className="flex items-start gap-2">
                <Circle
                  className={`mt-1 h-2 w-2 flex-none fill-current ${accentByType[a.type] ?? "text-cyan-300"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-white/90">{a.title}</div>
                  <div className="text-[11px] text-white/40">{a.subtitle}</div>
                </div>
                <span className="shrink-0 text-[10.5px] text-white/35">{formatRelativeTime(a.createdAt)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
