import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { FileText, Sparkles, Upload, Download, Wand2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/app/resume")({
  head: () => ({ meta: [{ title: "Resume Manager — Nexus" }] }),
  component: Resume,
});

const versions = [
  { name: "Master · Product", updated: "2h ago", score: 94, tag: "Primary" },
  { name: "AI Engineer focus", updated: "1d ago", score: 91, tag: "Variant" },
  { name: "Founding Designer", updated: "3d ago", score: 88, tag: "Variant" },
  { name: "Forward Deployed", updated: "5d ago", score: 86, tag: "Variant" },
];

function Resume() {
  const { user } = useAuth();
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="font-display text-[15px] font-semibold text-white">Resume versions</div>
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-1.5 text-[12px] text-white hover:bg-white/[0.1]">
              <Upload className="h-3 w-3" /> Upload
            </button>
          </div>
          <div className="mt-4 space-y-2.5">
            {versions.map((v, i) => (
              <motion.div key={v.name} whileHover={{ x: 3 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-600/20 ring-1 ring-white/10">
                  <FileText className="h-4 w-4 text-cyan-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-medium text-white">{v.name}</span>
                    <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/55">{v.tag}</span>
                  </div>
                  <div className="text-[11.5px] text-white/45">Updated {v.updated}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-base font-semibold text-cyan-300">{v.score}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-white/40">Match</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/5 bg-gradient-to-br from-indigo-500/10 to-violet-600/5 p-4">
            <div className="flex items-start gap-3">
              <Wand2 className="mt-0.5 h-4 w-4 text-cyan-300" />
              <div>
                <div className="text-[13px] font-medium text-white">Auto-optimize for next 5 roles</div>
                <div className="mt-1 text-[12px] text-white/55">Generate tailored variants in 90 seconds.</div>
                <button className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-black">
                  <Sparkles className="h-3 w-3" /> Run AI optimization
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass relative overflow-hidden rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Preview</div>
              <div className="font-display mt-1 text-[15px] font-semibold text-white">Master · Product</div>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white">
              <Download className="h-3 w-3" /> Export PDF
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-[#0a0f1e] p-6 ring-1 ring-white/5">
            <div className="border-b border-white/10 pb-4">
              <div className="font-display text-2xl font-semibold text-white">{user?.name ?? "Nexus User"}</div>
              <div className="mt-1 text-[12px] text-white/55">Senior Product Manager · San Francisco · {user?.email ?? "user@nexus.ai"}</div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Stripe", "Senior PM · 2022 — Present", "Led pricing platform launch — $84M ARR contribution."],
                ["Notion", "PM, AI · 2020 — 2022", "Shipped Notion AI launch reaching 4M MAUs in Q1."],
                ["Vercel", "Associate PM · 2018 — 2020", "Owned DX surface; reduced TTFB by 38%."],
              ].map(([c, r, d]) => (
                <div key={c} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-medium text-white">{c}</span>
                    <span className="text-[10.5px] text-white/40">{r}</span>
                  </div>
                  <div className="mt-1 text-[12px] text-white/65">{d}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Product Strategy", "0→1", "AI/ML", "Growth", "Pricing", "Platform"].map((s) => (
                <span key={s} className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10.5px] text-white/70 ring-1 ring-white/10">{s}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[["ATS score", "98"], ["Keyword fit", "94%"], ["Readability", "A+"]].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="text-[10.5px] uppercase tracking-[0.12em] text-white/45">{l}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="font-display text-lg font-semibold text-white">{v}</span>
                  <Check className="h-3 w-3 text-emerald-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}