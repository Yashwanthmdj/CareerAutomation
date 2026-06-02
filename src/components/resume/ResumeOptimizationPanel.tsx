import { useEffect, useState } from "react";
import { Gauge, Lightbulb, Loader2, TrendingUp } from "lucide-react";
import { resumeService } from "@/services/resume/resumeService";
import type { ResumeOptimization } from "@/types/resumeOptimization";
import { EMPTY_RESUME_OPTIMIZATION } from "@/types/resumeOptimization";

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-300";
  if (score >= 65) return "text-cyan-300";
  if (score >= 50) return "text-amber-300";
  return "text-rose-300";
}

function priorityStyle(priority: "High" | "Medium" | "Low"): string {
  if (priority === "High") return "border-rose-400/30 bg-rose-400/10 text-rose-200";
  if (priority === "Medium") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
}

export function ResumeOptimizationPanel({ resumeId }: { resumeId: string }) {
  const [data, setData] = useState<ResumeOptimization>(EMPTY_RESUME_OPTIMIZATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    resumeService
      .getOptimization(resumeId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load optimization");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
        Generating optimization report...
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-[12px] text-rose-200">{error}</div>;
  }

  const sectionEntries = Object.entries(data.sectionScores ?? {});

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
            <Gauge className="h-3.5 w-3.5 text-violet-300" />
            Health Score
          </div>
          <div className={`mt-2 font-display text-3xl font-semibold ${scoreColor(data.healthScore)}`}>
            {data.healthScore}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-300" />
            Estimated ATS Gain
          </div>
          <div className="mt-2 font-display text-3xl font-semibold text-cyan-300">+{data.estimatedAtsGain}</div>
        </div>
      </div>

      {data.impactSummary && (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-[12px] text-cyan-100">
          {data.impactSummary}
        </div>
      )}

      {sectionEntries.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Section Scores</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {sectionEntries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-[12px]">
                <span className="text-white/70">{key.replaceAll("_", " ")}</span>
                <span className={scoreColor(value)}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.keywordGaps.length > 0 && (
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/45">Keyword Gaps</div>
          <div className="flex flex-wrap gap-1.5">
            {data.keywordGaps.map((gap) => (
              <span key={gap} className="rounded-md border border-rose-400/25 bg-rose-400/10 px-2 py-0.5 text-[11px] text-rose-100">
                {gap}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.optimizationItems.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
            <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
            Recommendations
          </div>
          <div className="space-y-2">
            {data.optimizationItems.map((item, idx) => (
              <div key={`${item.title}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-white/90">{item.title}</div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] ${priorityStyle(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-white/70">{item.recommendation}</p>
                <p className="mt-1 text-[11px] text-white/45">{item.rationale}</p>
                <p className="mt-1 text-[11px] text-cyan-200/80">Estimated gain: +{item.estimatedGain}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
