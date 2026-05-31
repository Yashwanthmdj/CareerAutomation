import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bot, Play, Pause, Zap, Filter, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/app/automation")({
  head: () => ({ meta: [{ title: "AI Automation — Nexus" }] }),
  component: Automation,
});

const agents = [
  { name: "Apply Engine", desc: "Submits applications across portals", state: "Active", runs: "2,418", health: 96, accent: "indigo" },
  { name: "Form Filler", desc: "Completes multi-step ATS forms", state: "Active", runs: "5,902", health: 92, accent: "cyan" },
  { name: "Email Triage", desc: "Drafts and sends recruiter replies", state: "Active", runs: "1,184", health: 88, accent: "violet" },
  { name: "Resume Rewriter", desc: "Tailors resume per role context", state: "Paused", runs: "812", health: 81, accent: "emerald" },
  { name: "Opportunity Scout", desc: "Monitors 320+ sources for matches", state: "Active", runs: "12,401", health: 98, accent: "indigo" },
  { name: "Outreach Composer", desc: "Crafts referral & cold messages", state: "Active", runs: "624", health: 90, accent: "cyan" },
];

const logs = [
  { t: "Submitted Senior PM at Stripe", a: "Apply Engine", time: "2m", s: "ok" },
  { t: "Filled Greenhouse multi-step form", a: "Form Filler", time: "3m", s: "ok" },
  { t: "Drafted reply to Anthropic recruiter", a: "Email Triage", time: "6m", s: "ok" },
  { t: "Detected high-match role at Linear", a: "Opportunity Scout", time: "9m", s: "ok" },
  { t: "Rate limit hit — retrying LinkedIn", a: "Apply Engine", time: "14m", s: "warn" },
  { t: "Optimized resume for ML Eng role", a: "Resume Rewriter", time: "22m", s: "ok" },
  { t: "Sent referral DM via Slack", a: "Outreach Composer", time: "31m", s: "ok" },
];

function Automation() {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Active agents", "5", "of 6 online"],
          ["Tasks executed · 24h", "1,284", "+18% vs avg"],
          ["Avg run time", "1.2s", "p95 2.8s"],
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
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white">
              <Filter className="h-3 w-3" /> Filter
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {agents.map((a, i) => (
              <motion.div key={a.name} whileHover={{ y: -3 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4">
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
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] ${a.state === "Active" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-white/50"}`}>{a.state}</span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" style={{ width: `${a.health}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11.5px] text-white/50">
                  <span>{a.runs} runs · 24h</span>
                  <button className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">
                    {a.state === "Active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {a.state === "Active" ? "Pause" : "Resume"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white">
            <Zap className="h-4 w-4 text-cyan-300" />
            <span className="font-display text-[15px] font-semibold">Live execution log</span>
          </div>
          <div className="mt-4 space-y-2">
            {logs.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <span className={`h-1.5 w-1.5 rounded-full ${l.s === "ok" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] text-white/90">{l.t}</div>
                  <div className="text-[11px] text-white/40">{l.a} · {l.time} ago</div>
                </div>
                <ChevronRight className="h-3 w-3 text-white/30" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}