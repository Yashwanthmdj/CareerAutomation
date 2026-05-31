import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bell, CheckCheck, Briefcase, Mail, Bot, Calendar } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Nexus" }] }),
  component: Notifications,
});

const items = [
  { i: Briefcase, t: "New opportunity · 96% match", s: "Stripe — Staff Product Manager", time: "Just now", unread: true, accent: "cyan" },
  { i: Mail, t: "Recruiter reply received", s: "Anthropic — Sarah Chen", time: "12m", unread: true, accent: "indigo" },
  { i: Calendar, t: "Interview scheduled", s: "Vercel — Thursday 2pm PT", time: "1h", unread: true, accent: "violet" },
  { i: Bot, t: "AI applied to 4 roles overnight", s: "Apply Engine batch · 4/4 success", time: "5h", unread: false, accent: "emerald" },
  { i: Mail, t: "Outreach reply · referral granted", s: "Linear — Maya Rao", time: "1d", unread: false, accent: "indigo" },
  { i: Briefcase, t: "12 new opportunities matched", s: "Today's curated digest", time: "1d", unread: false, accent: "cyan" },
];

const accentMap: Record<string, string> = {
  cyan: "bg-cyan-400/10 text-cyan-300",
  indigo: "bg-indigo-400/10 text-indigo-300",
  violet: "bg-violet-400/10 text-violet-300",
  emerald: "bg-emerald-400/10 text-emerald-300",
};

function Notifications() {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-300" />
              <span className="font-display text-[15px] font-semibold text-white">Inbox</span>
              <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10.5px] text-cyan-300">3 new</span>
            </div>
            <button className="inline-flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {items.map((it, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ x: 3 }} className={`group relative flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${it.unread ? "border-white/10 bg-white/[0.04]" : "border-white/5 bg-white/[0.02]"}`}>
                <div className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${accentMap[it.accent]}`}>
                  <it.i className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-medium text-white">{it.t}</span>
                    {it.unread && <span className="h-1.5 w-1.5 flex-none rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />}
                  </div>
                  <div className="truncate text-[12px] text-white/55">{it.s}</div>
                </div>
                <span className="text-[11px] text-white/35">{it.time}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="font-display text-[15px] font-semibold text-white">Preferences</div>
          <div className="mt-4 space-y-3">
            {[
              ["High-match opportunities", true],
              ["Recruiter replies", true],
              ["Interview reminders", true],
              ["Daily digest email", true],
              ["Slack notifications", false],
              ["Weekly performance report", true],
            ].map(([l, on]) => (
              <div key={l as string} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">
                <span className="text-[13px] text-white/85">{l}</span>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-cyan-400/80" : "bg-white/10"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}