import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Briefcase, Send, Bot, Sparkles, Calendar, Inbox, ArrowUpRight, CheckCircle2, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/AppShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — Nexus" }] }),
  component: Dashboard,
});

const activity = [
  { t: "AI submitted application to Google", s: "Senior PM · 2m ago", c: "emerald" },
  { t: "Resume optimized for AI Engineer role", s: "Anthropic · 6m ago", c: "cyan" },
  { t: "Google Form completed successfully", s: "Notion · 14m ago", c: "indigo" },
  { t: "Recruiter replied — drafted response", s: "Stripe · 22m ago", c: "violet" },
  { t: "New high-match opportunity detected", s: "Linear · 41m ago", c: "emerald" },
];

function Dashboard() {
  const { user } = useAuth();
  return (
    <>
      <div className="glass mb-4 rounded-2xl p-4 text-sm text-white/75">
        Welcome back, <span className="text-white">{user?.name ?? "there"}</span>. Your autonomous pipeline is active.
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications sent" value="284" delta="+12.4%" icon={Send} accent="indigo" />
        <StatCard label="Jobs tracked" value="1,402" delta="+8.1%" icon={Briefcase} accent="cyan" />
        <StatCard label="AI success rate" value="94.2%" delta="+1.6%" icon={Bot} accent="violet" />
        <StatCard label="Interviews scheduled" value="11" delta="+3 wk" icon={Calendar} accent="emerald" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div whileHover={{ y: -3 }} className="glass relative overflow-hidden rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Pipeline · last 30 days</div>
              <div className="font-display mt-1 text-xl font-semibold text-white">Application velocity</div>
            </div>
            <Link to="/app/analytics" className="text-[12px] text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1">
              View analytics <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <Chart />
        </motion.div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-white">
            <Activity className="h-4 w-4 text-cyan-300" />
            <span className="font-display text-[15px] font-semibold">Live agent feed</span>
          </div>
          <div className="mt-4 space-y-3">
            {activity.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3"
              >
                <div className={`absolute left-0 top-0 h-full w-px bg-${a.c}-400 shadow-[0_0_6px_currentColor]`} />
                <div className="flex items-start gap-2">
                  <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 flex-none text-${a.c}-300`} />
                  <div>
                    <div className="text-[13px] text-white/90">{a.t}</div>
                    <div className="text-[11px] text-white/40">{a.s}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="font-display text-[15px] font-semibold text-white">Pending opportunities</div>
            <Link to="/app/opportunities" className="text-[12px] text-cyan-300 inline-flex items-center gap-1">Open <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {[
                ["Stripe", "Senior PM", "94%"],
                ["Vercel", "DX Engineer", "91%"],
                ["Linear", "Founding Designer", "88%"],
                ["OpenAI", "Forward Deployed", "85%"],
              ].map(([c, r, m]) => (
                <tr key={c} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 text-white/90">{c}</td>
                  <td className="py-2.5 text-white/60">{r}</td>
                  <td className="py-2.5 text-right text-cyan-300 font-medium">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="font-display text-[15px] font-semibold text-white">Automation health</div>
          <div className="mt-5 space-y-4">
            {[
              ["Apply engine", 96],
              ["Email triage", 88],
              ["Form filler", 92],
              ["Resume rewriter", 81],
            ].map(([l, v]) => (
              <div key={l as string}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-white/70">{l}</span>
                  <span className="text-white/50">{v}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 1.2, ease: [0.16,1,0.3,1] }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Chart() {
  const pts = [12, 18, 14, 22, 28, 25, 31, 36, 33, 41, 38, 46, 52, 49, 58, 64, 60, 71, 78, 74];
  const max = Math.max(...pts);
  const w = 600, h = 160;
  const step = w / (pts.length - 1);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${i * step},${h - (p / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="mt-6 w-full">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(99,102,241,0.5)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0)" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#g)" />
      <path d={d} stroke="rgb(165,180,252)" strokeWidth="2" fill="none" />
    </svg>
  );
}