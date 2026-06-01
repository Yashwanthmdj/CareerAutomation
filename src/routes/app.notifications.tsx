import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bell, CheckCheck } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Nexus" }] }),
  component: Notifications,
});

const PREF_LABELS: Record<string, string> = {
  highMatchOpportunities: "High-match opportunities",
  recruiterReplies: "Recruiter replies",
  interviewReminders: "Interview reminders",
  dailyDigestEmail: "Daily digest email",
  slackNotifications: "Slack notifications",
  weeklyPerformanceReport: "Weekly performance report",
};

function Notifications() {
  const { workspace, setNotificationPref, markAllNotificationsRead } = useWorkspace();
  const items = workspace.notifications;
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-300" />
              <span className="font-display text-[15px] font-semibold text-white">Inbox</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10.5px] text-cyan-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="inline-flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Bell}
                title="No notifications yet"
                description="Alerts for opportunities, recruiter replies, and automation events will appear here when activity begins."
                className="py-10"
              />
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {items.map((it, i) => (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ x: 3 }}
                  className={`group relative flex items-start gap-3 rounded-xl border p-3.5 ${
                    !it.read ? "border-white/10 bg-white/[0.04]" : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium text-white">{it.title}</div>
                    <div className="text-[12px] text-white/55">{it.body}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="font-display text-[15px] font-semibold text-white">Preferences</div>
          <p className="mt-1 text-[12px] text-white/50">Saved to your workspace for future notification delivery.</p>
          <div className="mt-4 space-y-3">
            {Object.entries(workspace.notificationPrefs).map(([key, on]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3"
              >
                <span className="text-[13px] text-white/85">{PREF_LABELS[key] ?? key}</span>
                <button
                  type="button"
                  onClick={() => setNotificationPref(key, !on)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-cyan-400/80" : "bg-white/10"}`}
                  aria-pressed={on}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
