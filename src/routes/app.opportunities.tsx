import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Search, Filter, ArrowUpRight, Briefcase } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/app/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — Nexus" }] }),
  component: Opportunities,
});

const filters = ["All", "Engineering", "Design", "Product", "AI/ML", "Remote", "Bookmarked"];

function Opportunities() {
  const { workspace } = useWorkspace();
  const items = workspace.opportunities;

  return (
    <>
      <div className="glass flex items-center gap-3 rounded-2xl p-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
          <Search className="h-3.5 w-3.5 text-white/40" />
          <input
            className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            placeholder="Search by company, role, location…"
            disabled={items.length === 0}
          />
        </div>
        <button
          type="button"
          disabled={items.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white disabled:opacity-40"
        >
          <Filter className="h-3.5 w-3.5" /> Filter
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {filters.map((t, i) => (
          <button
            key={t}
            type="button"
            disabled={items.length === 0}
            className={`rounded-full px-3 py-1.5 text-[12px] disabled:opacity-40 ${
              i === 0 ? "bg-white/[0.08] text-white ring-1 ring-white/10" : "text-white/55 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Briefcase}
            title="No opportunities discovered yet"
            description="Connect WhatsApp and LinkedIn to begin opportunity discovery. Your pipeline will populate here with real matches — never demo data."
            actionLabel="Connect integrations"
            actionTo="/app/integrations"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass rounded-2xl border border-dashed border-white/10 p-5 opacity-50"
              >
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="mt-2 h-3 w-1/3 rounded bg-white/5" />
                <div className="mt-6 h-1.5 rounded-full bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => (
            <motion.div
              key={it.id}
              whileHover={{ y: -4, rotateX: 2 }}
              style={{ transformStyle: "preserve-3d" }}
              className="glass group relative overflow-hidden rounded-2xl p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-[15px] font-semibold text-white">{it.role}</div>
                  <div className="mt-0.5 text-[12.5px] text-white/55">{it.company}</div>
                </div>
                {it.matchScore != null && (
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Match</div>
                    <div className="font-display text-xl font-semibold text-cyan-300">{it.matchScore}%</div>
                  </div>
                )}
              </div>
              {it.matchScore != null && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${it.matchScore}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400"
                  />
                </div>
              )}
              <div className="mt-5 flex items-center justify-between">
                <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-white/60">
                  {it.status}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[12.5px] text-cyan-300 hover:text-cyan-200"
                >
                  View <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
