import { motion } from "motion/react";
import {
  Target,
  Loader2,
  ChevronRight,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Code2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { resumeService } from "@/services/resume/resumeService";
import type { AtsIntelligence } from "@/types/ats";
import { atsScoreColor, atsScoreRing, EMPTY_ATS } from "@/types/ats";
import type { ResumeOptimization } from "@/types/resumeOptimization";
import { EMPTY_RESUME_OPTIMIZATION } from "@/types/resumeOptimization";
import { ImprovementRoadmap } from "@/components/resume/ImprovementRoadmap";
import {
  filterPendingRoadmapItems,
  getCompletedTaskTitles,
  loadCheckedTasks,
  mergeRoadmapItems,
  optimizationPotential,
  optimizationTasks,
  roadmapFromAts,
  roadmapFromOptimization,
  roleAlignmentFromAts,
  roleConfidenceFromAts,
  simulatorPreview,
} from "@/utils/resumeIntelligence";

type Props = {
  resumeId?: string | null;
  useActive?: boolean;
  compact?: boolean;
  className?: string;
  analysisRevision?: string;
};

const ATS_LAYOUT_DEBUG = false;

export function AtsIntelligencePanel({
  resumeId,
  useActive = false,
  compact = false,
  className = "",
  analysisRevision,
}: Props) {
  const [ats, setAts] = useState<AtsIntelligence>(EMPTY_ATS);
  const [optimization, setOptimization] = useState<ResumeOptimization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const atsPromise = useActive
      ? resumeService.getActiveAts()
      : resumeId
        ? resumeService.getAts(resumeId)
        : Promise.resolve(EMPTY_ATS);

    const optPromise =
      !compact && resumeId ? resumeService.getOptimization(resumeId).catch(() => null) : Promise.resolve(null);

    Promise.all([atsPromise, optPromise])
      .then(([atsData, optData]) => {
        if (cancelled) return;
        setAts(atsData);
        setOptimization(optData);
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
  }, [resumeId, useActive, compact, analysisRevision]);

  const checkedTasks = useMemo(
    () => (resumeId ? loadCheckedTasks(resumeId) : new Set<string>()),
    [resumeId, analysisRevision],
  );

  const roleAlignment = useMemo(() => roleAlignmentFromAts(ats), [ats]);
  const roleConfidence = useMemo(() => roleConfidenceFromAts(ats), [ats]);
  const basePotential = useMemo(() => optimizationPotential(optimization, ats), [optimization, ats]);

  const allTasks = useMemo(
    () => (optimization ? optimizationTasks(optimization, ats) : roadmapFromAts(ats)),
    [optimization, ats],
  );
  const completedTitles = useMemo(() => getCompletedTaskTitles(allTasks, checkedTasks), [allTasks, checkedTasks]);
  const completedTasks = useMemo(
    () => allTasks.filter((task) => completedTitles.has(task.title.toLowerCase().trim())),
    [allTasks, completedTitles],
  );

  const roadmapItems = useMemo(() => {
    const merged = mergeRoadmapItems(
      optimization ? roadmapFromOptimization(optimization) : [],
      roadmapFromAts(ats),
      6,
    );
    return filterPendingRoadmapItems(merged, completedTitles);
  }, [optimization, ats, completedTitles]);

  const potential = useMemo(() => {
    if (!optimization) return basePotential;
    const preview = simulatorPreview(
      basePotential.current,
      basePotential.projected,
      roadmapItems,
      completedTasks,
    );
    return {
      current: preview.currentScore,
      projected: preview.projectedScore,
      gain: preview.gainDelta,
    };
  }, [basePotential, optimization, roadmapItems, completedTasks]);

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
        <p className="font-medium">Unable to load ATS intelligence</p>
        <p className="mt-1 text-rose-200/80">{error}</p>
      </div>
    );
  }

  if (!ats.analysisReady && ats.atsScore === 0 && !ats.recommendations.length) {
    return (
      <div className={`rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center sm:px-6 ${className}`}>
        <Target className="mx-auto mb-3 h-8 w-8 text-violet-300/50" />
        <p className="font-display text-[15px] font-medium text-white/80">No ATS report yet</p>
        <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-5 text-white/45">
          Upload a PDF resume and wait for parsing to finish. Use <strong className="text-white/60">Re-analyze</strong> if
          you recently improved the parser.
        </p>
      </div>
    );
  }

  const scorePct = ats.atsScore;

  return (
    <div className={`space-y-4 sm:space-y-5 ${className}`}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-cyan-500/10 p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="relative grid h-28 w-28 shrink-0 place-items-center sm:h-36 sm:w-36">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br opacity-30 ${atsScoreRing(scorePct)}`} />
            <div className="relative grid h-24 w-24 place-items-center rounded-full bg-[#0a0f1a] ring-2 ring-white/15 sm:h-32 sm:w-32">
              <span className={`font-display text-3xl font-bold sm:text-4xl ${atsScoreColor(scorePct)}`}>
                {scorePct}
              </span>
              <span className="absolute -bottom-1 text-[10px] uppercase tracking-wider text-white/40">ATS</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Target className="h-4 w-4 text-violet-300" />
              <span className="font-display text-[16px] font-semibold text-white sm:text-[17px]">ATS Intelligence</span>
              <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-2 py-0.5 text-[10px] font-semibold text-violet-200">
                {premiumGrade(scorePct)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <RoleConfidenceBadge role={roleConfidence.role} confidence={roleConfidence.confidence} />
            </div>

            <p className="mt-2 text-[12px] text-white/50">
              Source: <span className="text-white/65">{roleConfidence.source}</span>
            </p>
            <p className="mt-2 text-[13px] text-cyan-100/90">{premiumStatus(scorePct)}</p>

            {!compact && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <OptimizationPotentialCard
                  current={potential.current}
                  projected={potential.projected}
                  gain={potential.gain}
                />
                <RoleAlignmentCard
                  matched={roleAlignment.matched}
                  total={roleAlignment.total}
                  percentage={roleAlignment.percentage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {!compact && (
        <div
          className={`relative isolate grid gap-4 border-0 bg-transparent sm:grid-cols-2 ${
            ATS_LAYOUT_DEBUG ? "rounded-lg border-2 border-red-500/90 p-1" : ""
          }`}
        >
          <InsightList
            title="What You're Doing Well"
            icon={TrendingUp}
            items={ats.strengths}
            emptyLabel="Add measurable wins to your experience and projects to unlock strengths."
            accent="emerald"
            debugBorder={ATS_LAYOUT_DEBUG ? "left" : undefined}
          />
          <InsightList
            title="Biggest Improvement Areas"
            icon={AlertTriangle}
            items={ats.weaknesses}
            emptyLabel="No major risk areas detected. Keep your resume updated."
            accent="amber"
            debugBorder={ATS_LAYOUT_DEBUG ? "right" : undefined}
          />
        </div>
      )}

      {!compact && (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-white/50">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              Resume Improvement Roadmap
            </div>
            {potential.gain > 0 && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200">
                Up to +{potential.gain} ATS {completedTasks.length > 0 ? "estimated" : "possible"}
              </span>
            )}
          </div>
          {completedTasks.length > 0 && (
            <p className="mb-3 text-[12px] leading-5 text-white/50">
              {roadmapItems.length === 0
                ? "All roadmap actions are marked complete. Re-analyze your resume below to refresh official scores."
                : "Completed tasks are hidden. Re-analyze after updating your resume to apply changes."}
            </p>
          )}
          <ImprovementRoadmap
            items={roadmapItems}
            emptyMessage="Your ATS baseline is solid — or all roadmap actions are complete pending re-analyze."
          />
        </div>
      )}

      {!compact && (
        <details className="rounded-xl border border-white/10 bg-white/[0.02]">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[12px] text-white/60 marker:content-none">
            <Code2 className="h-3.5 w-3.5 text-white/45" />
            Developer Diagnostics
            <span className="ml-auto text-[10px] text-white/35">Collapsed by default</span>
          </summary>
          <div className="space-y-4 border-t border-white/10 px-4 py-4">
            {ats.scoreBreakdown.length > 0 && (
              <div>
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

            {ats.missingSkills.length > 0 && (
              <div>
                <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/45">Keyword Gaps</div>
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

            {(ats.matchedSkills.length > 0 || ats.targetSkillSet.length > 0) && (
              <div className="rounded-xl border border-violet-400/15 bg-violet-400/5 p-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">ATS skill diagnostics</div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <DiagnosticBlock title="Direct matches" items={ats.directMatches} accent="emerald" />
                  <DiagnosticBlock title="Target skill set used" items={ats.targetSkillSet} accent="violet" />
                </div>
                {ats.familyMatches.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-[12px] font-medium text-amber-200/90">Family matches (partial credit)</div>
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

            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/40">
              {ats.resumeSkillCount} resume skills · {ats.targetSkillCount} role signals · analysis{" "}
              {ats.analysisReady ? "ready" : "pending"}
            </div>
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

function RoleConfidenceBadge({ role, confidence }: { role: string; confidence: number }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1">
      <ShieldCheck className="h-3.5 w-3.5 text-violet-300" />
      <span className="text-[11px] text-white/70">
        <span className="text-violet-200">{role}</span>
        <span className="text-white/35"> · </span>
        <span className="font-medium text-white/85">{confidence}% confidence</span>
      </span>
    </div>
  );
}

function OptimizationPotentialCard({
  current,
  projected,
  gain,
}: {
  current: number;
  projected: number;
  gain: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-left">
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Optimization Potential</div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricPill label="Current ATS" value={current} />
        <MetricPill label="Projected ATS" value={projected} accent="text-cyan-300" />
        <MetricPill label="Potential Gain" value={gain} accent="text-emerald-300" prefix="+" />
        <div className="col-span-2 sm:col-span-1">
          <div className="text-[10px] text-white/40">Trajectory</div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, projected)}%` }}
              transition={{ duration: 0.7 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricPill({ label, value, accent = "text-white", prefix = "" }: { label: string; value: number; accent?: string; prefix?: string }) {
  return (
    <div>
      <div className="text-[10px] text-white/40">{label}</div>
      <div className={`mt-0.5 font-display text-lg font-semibold ${accent}`}>
        {prefix}
        {value}
      </div>
    </div>
  );
}

function RoleAlignmentCard({
  matched,
  total,
  percentage,
}: {
  matched: number;
  total: number;
  percentage: number;
}) {
  const pct = Math.max(0, Math.min(100, percentage));
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-left">
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Role Alignment</div>
      <div className="mt-2 flex items-center gap-3">
        <div
          className="relative h-14 w-14 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(rgba(56,189,248,0.9) ${pct}%, rgba(255,255,255,0.1) ${pct}% 100%)`,
          }}
        >
          <div className="absolute inset-[4px] grid place-items-center rounded-full bg-[#0b1220] text-[11px] font-semibold text-cyan-200">
            {pct}%
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white/85">
            {matched} / {total} skills matched
          </p>
          <p className="mt-0.5 text-[11px] text-white/50">Against detected role target library</p>
        </div>
      </div>
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

function NormalizationTable({
  title,
  rows,
}: {
  title: string;
  rows: { raw: string; normalized: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <div className="border-b border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-white/45">
        {title}
      </div>
      <table className="w-full min-w-[280px] text-left text-[11px]">
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
    <div className={`overflow-hidden rounded-xl border ${border} ${debugClass} bg-white/[0.02] p-3 sm:p-4`}>
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/80">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        {title}
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-[11.5px] leading-5 text-white/40">{emptyLabel}</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[11.5px] text-white/70 marker:text-white/55">
          {items.map((item, i) => (
            <li key={i} className="leading-5">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
