import { motion } from "motion/react";
import {
  Target,
  Lightbulb,
  Loader2,
  ChevronRight,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronsDownUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { resumeService } from "@/services/resume/resumeService";
import type { AtsIntelligence } from "@/types/ats";
import { atsScoreColor, atsScoreRing, EMPTY_ATS } from "@/types/ats";

type Props = {
  resumeId?: string | null;
  useActive?: boolean;
  compact?: boolean;
  className?: string;
};

const ATS_LAYOUT_DEBUG = false;

export function AtsIntelligencePanel({
  resumeId,
  useActive = false,
  compact = false,
  className = "",
}: Props) {
  const [ats, setAts] = useState<AtsIntelligence>(EMPTY_ATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = useActive
      ? resumeService.getActiveAts()
      : resumeId
        ? resumeService.getAts(resumeId)
        : Promise.resolve(EMPTY_ATS);

    load
      .then((data) => {
        if (!cancelled) setAts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load ATS score");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resumeId, useActive]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-sm text-white/50 ${className}`}
      >
        <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
        Computing ATS score…
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[12.5px] text-rose-200 ${className}`}>
        {error}
      </div>
    );
  }

  if (!ats.analysisReady && ats.atsScore === 0 && !ats.recommendations.length) {
    return (
      <div className={`rounded-2xl border border-dashed border-white/10 p-6 text-center text-[12.5px] text-white/50 ${className}`}>
        Upload and parse a resume to generate your ATS intelligence report.
      </div>
    );
  }

  const scorePct = ats.atsScore;
  const grade = premiumGrade(scorePct);
  const status = premiumStatus(scorePct);
  const topActions = ats.recommendations.slice(0, 3);
  const skillCoverage = ats.targetSkillCount
    ? Math.round((ats.matchedSkills.length / ats.targetSkillCount) * 100)
    : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-cyan-500/10 p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="flex flex-wrap items-start gap-6">
          <div className="relative grid h-36 w-36 shrink-0 place-items-center">
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-br opacity-30 ${atsScoreRing(scorePct)}`}
            />
            <div className="relative grid h-32 w-32 place-items-center rounded-full bg-[#0a0f1a] ring-2 ring-white/15">
              <span className={`font-display text-4xl font-bold ${atsScoreColor(scorePct)}`}>
                {scorePct}
              </span>
              <span className="absolute -bottom-1 text-[10px] uppercase tracking-wider text-white/40">
                ATS
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Target className="h-4 w-4 text-violet-300" />
              <span className="font-display text-[17px] font-semibold text-white">ATS Intelligence</span>
              <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-2 py-0.5 text-[10px] font-semibold text-violet-200">
                {grade}
              </span>
            </div>
            {(ats.detectedRole || ats.targetRole) && (
              <p className="mt-1 text-[12px] text-white/55">
                Resume role:{" "}
                <span className="font-medium text-violet-200">{ats.detectedRole || ats.targetRole}</span>
              </p>
            )}
            <p className="mt-2 text-[13px] text-cyan-100/90">{status}</p>
            <p className="mt-2 text-[11.5px] text-white/45">
              {ats.resumeSkillCount} skills detected · {ats.targetSkillCount} role signals assessed
            </p>
            <div className="mt-4">
              <PremiumMetrics score={scorePct} coverage={skillCoverage} />
            </div>
          </div>
        </div>
      </div>

      {!compact && (
        <div
          className={`relative isolate overflow-hidden border-0 bg-transparent divide-y-0 grid gap-4 sm:grid-cols-2 ${
            ATS_LAYOUT_DEBUG ? "rounded-lg border-2 border-red-500/90 p-1" : ""
          }`}
        >
          <InsightList
            title="What You're Doing Well"
            icon={TrendingUp}
            items={ats.strengths}
            emptyLabel="Your resume is in progress. Keep adding clear wins."
            accent="emerald"
            debugBorder={ATS_LAYOUT_DEBUG ? "left" : undefined}
          />
          <InsightList
            title="Biggest Improvement Areas"
            icon={AlertTriangle}
            items={ats.weaknesses}
            emptyLabel="No major risk areas detected right now."
            accent="amber"
            debugBorder={ATS_LAYOUT_DEBUG ? "right" : undefined}
          />
        </div>
      )}

      {!compact && topActions.length > 0 && (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-white/50">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Resume Improvement Roadmap
          </div>
          <div className="space-y-2">
            {topActions.map((rec, i) => {
              const gain = estimateAtsGain(rec, i);
              return (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[12.5px] text-white/80">{rec}</p>
                    <span className="shrink-0 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-200">
                      +{gain} ATS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!compact && ats.missingSkills.length > 0 && (
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
            Keyword Gaps (Role-specific)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ats.missingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[11px] text-rose-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {!compact && ats.recommendations.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-white/45">
            <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
            Actionable Recommendations
          </div>
          <div className="grid gap-2">
            {ats.recommendations.map((rec, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] text-white/80">{rec}</span>
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!compact && ats.scoreBreakdown.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/45">Score Breakdown</div>
          <div className="space-y-2">
            {ats.scoreBreakdown.map((item) => (
              <div key={item.category}>
                <div className="flex justify-between text-[12px]">
                  <span className="text-white/75">{item.label}</span>
                  <span className="text-white/50">
                    {item.score}/100 <span className="text-white/30">({item.weight}%)</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full bg-gradient-to-r ${atsScoreRing(item.score)}`}
                  />
                </div>
                {item.detail && <p className="mt-0.5 text-[10.5px] text-white/35">{item.detail}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!compact && (
        <details className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[12px] text-white/60">
            <ChevronsDownUp className="h-3.5 w-3.5 text-white/45" />
            Advanced Analysis
          </summary>
          <div className="mt-3 space-y-4">
            {(ats.matchedSkills.length > 0 || ats.targetSkillSet.length > 0) && (
              <div className="rounded-xl border border-violet-400/15 bg-violet-400/5 p-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">ATS diagnostics</div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <DiagnosticBlock title="Direct matches" items={ats.directMatches} accent="emerald" />
                  <DiagnosticBlock title="Target skill set used" items={ats.targetSkillSet} accent="violet" />
                </div>
                {ats.familyMatches.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-[12px] font-medium text-amber-200/90">
                      Family matches (partial credit)
                    </div>
                    <div className="space-y-2">
                      {ats.familyMatches.map((fm) => (
                        <div
                          key={`${fm.targetSkill}-${fm.resumeSkill}`}
                          className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-white/70"
                        >
                          <span className="text-amber-200">{fm.resumeSkill}</span>
                          <span className="text-white/40"> → </span>
                          <span className="text-white/80">{fm.targetSkill}</span>
                          <span className="ml-1 text-white/35">({fm.family})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {ats.resumeSkillsNormalized.length > 0 && (
              <NormalizationTable title="Resume skills (raw → normalized)" rows={ats.resumeSkillsNormalized} />
            )}

            {ats.targetSkillsNormalized.length > 0 && (
              <NormalizationTable title="Target skills (raw → normalized)" rows={ats.targetSkillsNormalized} />
            )}
          </div>
        </details>
      )}

      {compact && (
        <Link
          to="/app/resume"
          className="inline-flex items-center gap-1 text-[12px] text-cyan-300 hover:text-cyan-200"
        >
          Full ATS report <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function premiumGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  return "C";
}

function premiumStatus(score: number): string {
  if (score >= 85) return "Excellent momentum. Your resume is highly competitive for ATS screening.";
  if (score >= 70) return "Strong baseline. A few strategic upgrades can unlock better interview conversion.";
  if (score >= 55) return "Good start. Focused improvements can materially lift your ATS performance.";
  return "High upside detected. Prioritize the roadmap actions below for faster ATS gains.";
}

function estimateAtsGain(recommendation: string, index: number): number {
  const text = recommendation.toLowerCase();
  if (text.includes("skills") || text.includes("keyword")) return 10 - index;
  if (text.includes("project")) return 7 - index;
  if (text.includes("metric") || text.includes("quantify")) return 8 - index;
  return Math.max(3, 6 - index);
}

function NormalizationTable({
  title,
  rows,
}: {
  title: string;
  rows: { raw: string; normalized: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="border-b border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-white/45">
        {title}
      </div>
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="text-white/40">
            <th className="px-3 py-1.5 font-medium">Raw</th>
            <th className="px-3 py-1.5 font-medium">Normalized</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.raw} className="border-t border-white/5">
              <td className="px-3 py-1.5 text-white/70">{row.raw}</td>
              <td className="px-3 py-1.5 text-cyan-200/90">{row.normalized}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DiagnosticBlock({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "emerald" | "violet";
}) {
  const chip =
    accent === "emerald"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : "border-violet-400/20 bg-violet-400/10 text-violet-100";
  return (
    <div>
      <div className="text-[12px] font-medium text-white/75">{title}</div>
      {items.length === 0 ? (
        <p className="mt-1 text-[11px] text-white/40">None</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1">
          {items.map((item) => (
            <span key={item} className={`rounded-md border px-1.5 py-0.5 text-[10.5px] ${chip}`}>
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightList({
  title,
  icon: Icon,
  items,
  emptyLabel,
  accent,
  debugBorder,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
  emptyLabel: string;
  accent: "emerald" | "amber";
  debugBorder?: "left" | "right";
}) {
  const border = accent === "emerald" ? "border-emerald-400/15" : "border-amber-400/15";
  const iconColor = accent === "emerald" ? "text-emerald-300" : "text-amber-300";
  const debugClass = debugBorder ? "border-2 border-red-500/90" : "";

  return (
    <div className={`overflow-hidden rounded-xl border ${border} ${debugClass} bg-white/[0.02] p-3`}>
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/80">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        {title}
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-[11.5px] text-white/40">{emptyLabel}</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[11.5px] text-white/70 marker:text-white/55">
          {items.map((item, i) => (
            <li key={i} className="border-0 p-0 m-0 leading-5">
              {normalizeStrengthItem(title, item, i)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function normalizeStrengthItem(title: string, item: string, index: number): string {
  if (title !== "What You're Doing Well") {
    return item;
  }
  // Keep the first item plain and stable to avoid any structural artifacts from richer layouts.
  if (index === 0 && item.toLowerCase().startsWith("clear role title")) {
    return "Clear role title";
  }
  return item;
}

function PremiumMetrics({ score, coverage }: { score: number; coverage: number }) {
  const c = Math.max(0, Math.min(100, coverage));
  const graphHeights = [score * 0.45, score * 0.6, score * 0.75, score * 0.9, score * 0.82].map((v) =>
    Math.max(16, Math.min(56, Math.round(v))),
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">ATS Trend Signal</div>
        <div className="mt-3 flex h-16 items-end gap-1.5">
          {graphHeights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 8, opacity: 0.5 }}
              animate={{ height: h, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="w-5 rounded-md bg-gradient-to-t from-cyan-500/40 to-violet-400/80"
            />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Skill Coverage</div>
        <div className="mt-2 flex items-center gap-3">
          <div
            className="relative h-14 w-14 rounded-full"
            style={{
              background: `conic-gradient(rgba(56,189,248,0.9) ${c}%, rgba(255,255,255,0.1) ${c}% 100%)`,
            }}
          >
            <div className="absolute inset-[4px] grid place-items-center rounded-full bg-[#0b1220] text-[11px] font-semibold text-cyan-200">
              {c}%
            </div>
          </div>
          <p className="text-[11px] text-white/60">Matched role signals against target skill set.</p>
        </div>
      </div>
    </div>
  );
}
