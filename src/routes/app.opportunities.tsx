import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Search, Filter, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/app/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — Nexus" }] }),
  component: Opportunities,
});

const items = [
  { c: "Stripe", r: "Senior Product Manager", m: 94, conf: "High", status: "Ready", due: "3d" },
  { c: "Vercel", r: "Developer Experience Eng", m: 91, conf: "High", status: "Drafting", due: "5d" },
  { c: "Linear", r: "Founding Designer", m: 88, conf: "Medium", status: "Ready", due: "2d" },
  { c: "OpenAI", r: "Forward Deployed Eng", m: 85, conf: "High", status: "Queued", due: "7d" },
  { c: "Anthropic", r: "Research Engineer", m: 83, conf: "Medium", status: "Ready", due: "4d" },
  { c: "Notion", r: "AI Product Lead", m: 80, conf: "Medium", status: "Ready", due: "6d" },
];

function Opportunities() {
  return (
    <>
      <div className="glass flex items-center gap-3 rounded-2xl p-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
          <Search className="h-3.5 w-3.5 text-white/40" />
          <input className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none" placeholder="Search by company, role, location…" />
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"><Filter className="h-3.5 w-3.5" /> Filter</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["All", "Engineering", "Design", "Product", "AI/ML", "Remote", "Bookmarked"].map((t, i) => (
          <button key={t} className={`rounded-full px-3 py-1.5 text-[12px] ${i===0 ? "bg-white/[0.08] text-white ring-1 ring-white/10" : "text-white/55 hover:text-white"}`}>{t}</button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it, i) => (
          <motion.div key={i} whileHover={{ y: -4, rotateX: 2 }} style={{ transformStyle: "preserve-3d" }} className="glass group relative overflow-hidden rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-[15px] font-semibold text-white">{it.r}</div>
                <div className="mt-0.5 text-[12.5px] text-white/55">{it.c}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Match</div>
                <div className="font-display text-xl font-semibold text-cyan-300">{it.m}%</div>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${it.m}%` }} viewport={{ once: true }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />
            </div>
            <div className="mt-4 flex items-center justify-between text-[12px] text-white/60">
              <span>AI confidence · <span className="text-white/85">{it.conf}</span></span>
              <span>Due in {it.due}</span>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-emerald-300">{it.status}</span>
              <button className="inline-flex items-center gap-1 text-[12.5px] text-cyan-300 hover:text-cyan-200">Apply <ArrowUpRight className="h-3 w-3" /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}