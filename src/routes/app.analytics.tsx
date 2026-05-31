import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { TrendingUp, Target, Clock, Award } from "lucide-react";
import { StatCard } from "@/components/dashboard/AppShell";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Nexus" }] }),
  component: Analytics,
});

function Analytics() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Response rate" value="38.4%" delta="+4.2%" icon={TrendingUp} accent="indigo" />
        <StatCard label="Interview rate" value="14.1%" delta="+1.8%" icon={Target} accent="cyan" />
        <StatCard label="Avg time to apply" value="42s" delta="-12s" icon={Clock} accent="violet" />
        <StatCard label="Offer conversion" value="6.2%" delta="+0.9%" icon={Award} accent="emerald" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div whileHover={{ y: -2 }} className="glass relative overflow-hidden rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Funnel · 90 days</div>
              <div className="font-display mt-1 text-xl font-semibold text-white">Conversion velocity</div>
            </div>
            <div className="flex gap-2 text-[11px]">
              {["7d", "30d", "90d"].map((t, i) => (
                <button key={t} className={`rounded-full px-2.5 py-1 ${i===2 ? "bg-white/10 text-white" : "text-white/45"}`}>{t}</button>
              ))}
            </div>
          </div>
          <AreaChart />
        </motion.div>

        <div className="glass rounded-2xl p-6">
          <div className="font-display text-[15px] font-semibold text-white">Funnel breakdown</div>
          <div className="mt-5 space-y-4">
            {[
              ["Sourced", 1402, 100, "indigo"],
              ["Applied", 284, 20, "cyan"],
              ["Replied", 109, 7.7, "violet"],
              ["Interviewed", 40, 2.8, "emerald"],
              ["Offers", 11, 0.78, "amber"],
            ].map(([l, n, pct]) => (
              <div key={l as string}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-white/80">{l}</span>
                  <span className="text-white/50"><span className="text-white/85">{(n as number).toLocaleString()}</span> · {pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.16,1,0.3,1] }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="font-display text-[15px] font-semibold text-white">Top performing channels</div>
          <div className="mt-4 space-y-3">
            {[
              ["Direct apply · careers pages", 142, 48],
              ["Greenhouse ATS", 78, 26],
              ["Lever", 41, 14],
              ["LinkedIn Easy Apply", 23, 8],
              ["Referrals via agent outreach", 12, 4],
            ].map(([c, n, p]) => (
              <div key={c as string} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
                <span className="text-[13px] text-white/85">{c}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-white/55">{n}</span>
                  <span className="text-[12px] font-medium text-cyan-300">{p}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="font-display text-[15px] font-semibold text-white">Hot companies — last 30d</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Stripe", 12, 94],
              ["Vercel", 9, 91],
              ["Anthropic", 8, 89],
              ["Linear", 7, 88],
              ["OpenAI", 6, 85],
              ["Notion", 5, 83],
            ].map(([c, n, m]) => (
              <motion.div key={c as string} whileHover={{ y: -3 }} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="text-[13px] font-medium text-white">{c}</div>
                <div className="mt-1 text-[11px] text-white/45">{n} interactions</div>
                <div className="mt-2 font-display text-base font-semibold text-cyan-300">{m}%</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function AreaChart() {
  const a = [10, 14, 12, 18, 24, 22, 28, 34, 30, 38, 36, 44, 50, 47, 56];
  const b = [4, 6, 5, 9, 12, 11, 16, 20, 18, 24, 22, 28, 32, 30, 38];
  const w = 700, h = 200;
  const max = 60;
  const step = w / (a.length - 1);
  const path = (arr: number[]) => arr.map((p, i) => `${i ? "L" : "M"}${i * step},${h - (p / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="mt-6 w-full">
      <defs>
        <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.45)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </linearGradient>
        <linearGradient id="gb" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(99,102,241,0.5)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0)" />
        </linearGradient>
      </defs>
      <path d={`${path(a)} L${w},${h} L0,${h} Z`} fill="url(#ga)" />
      <path d={path(a)} stroke="rgb(103,232,249)" strokeWidth="2" fill="none" />
      <path d={`${path(b)} L${w},${h} L0,${h} Z`} fill="url(#gb)" />
      <path d={path(b)} stroke="rgb(165,180,252)" strokeWidth="2" fill="none" />
    </svg>
  );
}