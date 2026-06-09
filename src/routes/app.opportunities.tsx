import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Search, Filter, ArrowUpRight, Briefcase, Bookmark, Plus, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AddOpportunityModal } from "@/components/opportunities/AddOpportunityModal";
import { opportunityService } from "@/services/opportunity/opportunityService";
import type { Opportunity, OpportunityType, SourceType } from "@/types/opportunity";
import {
  formatOpportunityType,
  formatSourceType,
  OPPORTUNITY_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
} from "@/types/opportunity";

export const Route = createFileRoute("/app/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — Nexus" }] }),
  component: Opportunities,
});

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Opportunities() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceType | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<OpportunityType | "ALL">("ALL");
  const [savedOnly, setSavedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingSaveId, setPendingSaveId] = useState<string | null>(null);
  const [ingestNotice, setIngestNotice] = useState<string | null>(null);

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await opportunityService.search({
        q: search.trim() || undefined,
        sourceType: sourceFilter === "ALL" ? undefined : sourceFilter,
        opportunityType: typeFilter === "ALL" ? undefined : typeFilter,
        savedOnly,
      });
      setItems(result.opportunities);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load opportunities");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, typeFilter, savedOnly]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOpportunities();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadOpportunities]);

  const hasActiveFilters = useMemo(
    () => sourceFilter !== "ALL" || typeFilter !== "ALL" || savedOnly,
    [sourceFilter, typeFilter, savedOnly],
  );

  const toggleSave = async (opportunity: Opportunity) => {
    setPendingSaveId(opportunity.id);
    try {
      if (opportunity.isSaved) {
        await opportunityService.unsave(opportunity.id);
      } else {
        await opportunityService.save(opportunity.id);
      }
      await loadOpportunities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update bookmark");
    } finally {
      setPendingSaveId(null);
    }
  };

  return (
    <>
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
          <Search className="h-3.5 w-3.5 text-white/40" />
          <input
            className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            placeholder="Search by title, company, skills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm ${
            showFilters || hasActiveFilters
              ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
              : "border-white/10 bg-white/[0.04] text-white"
          }`}
        >
          <Filter className="h-3.5 w-3.5" /> Filter
        </button>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 px-3 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Add Opportunity
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-3">
          <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Source
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceType | "ALL")}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
            >
              <option value="ALL">All sources</option>
              {SOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Opportunity Type
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as OpportunityType | "ALL")}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
            >
              <option value="ALL">All types</option>
              {OPPORTUNITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end">
            <button
              type="button"
              onClick={() => setSavedOnly((v) => !v)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
                savedOnly
                  ? "border-violet-400/30 bg-violet-400/10 text-violet-100"
                  : "border-white/10 bg-white/[0.03] text-white/70"
              }`}
            >
              {savedOnly ? "Showing saved only" : "Show saved only"}
            </button>
          </label>
        </div>
      )}

      {ingestNotice && (
        <div className="mt-4 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-[12px] text-cyan-100">
          {ingestNotice}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[12px] text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          Loading opportunities…
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Briefcase}
            title="No opportunities yet"
            description="Add your first opportunity manually or connect integrations in later phases. Your global opportunity feed starts here."
            actionLabel="Add opportunity"
            onAction={() => setShowAddModal(true)}
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => (
            <motion.div
              key={it.id}
              whileHover={{ y: -4 }}
              className="glass group relative overflow-hidden rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-[15px] font-semibold text-white">{it.title}</div>
                  <div className="mt-0.5 text-[12.5px] text-white/55">{it.company}</div>
                </div>
                <button
                  type="button"
                  disabled={pendingSaveId === it.id}
                  onClick={() => void toggleSave(it)}
                  className={`shrink-0 rounded-lg border p-2 ${
                    it.isSaved
                      ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                  }`}
                  aria-label={it.isSaved ? "Unsave opportunity" : "Save opportunity"}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${it.isSaved ? "fill-current" : ""}`} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/60">
                  {formatSourceType(it.sourceType)}
                </span>
                <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-cyan-200">
                  {formatOpportunityType(it.opportunityType)}
                </span>
              </div>

              {it.requiredSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {it.requiredSkills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 text-[11px] text-white/45">Deadline: {formatDeadline(it.deadline)}</div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-[11px] text-white/40">{it.location || "Location flexible"}</span>
                {it.applyLink ? (
                  <a
                    href={it.applyLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[12.5px] text-cyan-300 hover:text-cyan-200"
                  >
                    Apply <ArrowUpRight className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-[12px] text-white/35">No apply link</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddOpportunityModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (input) => {
          const result = await opportunityService.ingest(input);
          setIngestNotice(result.message);
          await loadOpportunities();
        }}
      />
    </>
  );
}
