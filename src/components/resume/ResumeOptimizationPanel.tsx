import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Gauge,
  Lightbulb,
  ListChecks,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { resumeService } from "@/services/resume/resumeService";
import type { ResumeOptimization, SectionScores } from "@/types/resumeOptimization";
import { EMPTY_RESUME_OPTIMIZATION } from "@/types/resumeOptimization";
import { EMPTY_ATS } from "@/types/ats";
import type { AtsIntelligence } from "@/types/ats";
import { CheckableTaskList } from "@/components/resume/CheckableTaskList";
import { ImprovementRoadmap } from "@/components/resume/ImprovementRoadmap";
import {
  clearCheckedTasks,
  filterPendingRoadmapItems,
  getCompletedTaskTitles,
  loadCheckedTasks,
  optimizationTasks,
  resumeReadinessFromData,
  roleConfidenceFromAts,
  roadmapFromOptimization,
  saveCheckedTasks,
  simulatorPreview,
} from "@/utils/resumeIntelligence";

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-300";
  if (score >= 65) return "text-cyan-300";
  if (score >= 50) return "text-amber-300";
  return "text-rose-300";
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 65) return "bg-cyan-400";
  if (score >= 50) return "bg-amber-400";
  return "bg-rose-400";
}

const SECTION_LABELS: Record<keyof SectionScores, string> = {
  summary: "Summary",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
};

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  delay = 0,
  suffix = "",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  delay?: number;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        {label}
      </div>
      <div className={`mt-2 font-display text-2xl font-semibold sm:text-3xl ${scoreColor(value)}`}>
        {value}
        {suffix}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${scoreBarColor(value)}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: delay + 0.1 }}
        />
      </div>
    </motion.div>
  );
}

function SectionScoreRow({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-white/70">{label}</span>
        <span className={`font-medium ${scoreColor(value)}`}>{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${scoreBarColor(value)}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, delay: delay + 0.05 }}
        />
      </div>
    </motion.div>
  );
}

function ReadinessBadge({
  label,
  ready,
  icon: Icon,
}: {
  label: string;
  ready: boolean;
  icon: React.ElementType;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        ready
          ? "border-emerald-400/25 bg-emerald-400/10"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
          ready ? "bg-emerald-400/20 text-emerald-300" : "bg-white/5 text-white/40"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-white/85">{label}</div>
        <div className={`text-[11px] ${ready ? "text-emerald-200/90" : "text-white/45"}`}>
          {ready ? "Ready" : "Needs work"}
        </div>
      </div>
    </div>
  );
}

type ResumeOptimizationPanelProps = {
  resumeId: string;
  onReanalyze?: () => Promise<void>;
  isAnalyzing?: boolean;
  /** Bumps when resume parsing finishes — triggers score refresh and clears completed tasks. */
  analysisRevision?: string;
};

async function loadOptimizationData(resumeId: string) {
  const [opt, atsData] = await Promise.all([
    resumeService.getOptimization(resumeId),
    resumeService.getAts(resumeId),
  ]);
  return { opt, atsData };
}

export function ResumeOptimizationPanel({
  resumeId,
  onReanalyze,
  isAnalyzing = false,
  analysisRevision,
}: ResumeOptimizationPanelProps) {
  const [data, setData] = useState<ResumeOptimization>(EMPTY_RESUME_OPTIMIZATION);
  const [ats, setAts] = useState<AtsIntelligence>(EMPTY_ATS);
  const [checked, setChecked] = useState<Set<string>>(() => loadCheckedTasks(resumeId));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);
  const prevAnalysisRevision = useRef<string | undefined>();

  const reloadScores = useCallback(async () => {
    const { opt, atsData } = await loadOptimizationData(resumeId);
    setData(opt);
    setAts(atsData);
  }, [resumeId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadOptimizationData(resumeId)
      .then(({ opt, atsData }) => {
        if (cancelled) return;
        setData(opt);
        setAts(atsData);
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

  useEffect(() => {
    if (!analysisRevision) return;
    if (prevAnalysisRevision.current === undefined) {
      prevAnalysisRevision.current = analysisRevision;
      return;
    }
    if (prevAnalysisRevision.current === analysisRevision) return;
    prevAnalysisRevision.current = analysisRevision;
    clearCheckedTasks(resumeId);
    setChecked(new Set());
    void reloadScores().catch(() => {
      // keep existing scores if refresh fails
    });
  }, [analysisRevision, resumeId, reloadScores]);

  const toggleTask = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveCheckedTasks(resumeId, next);
        return next;
      });
    },
    [resumeId],
  );

  const roleConfidence = useMemo(() => roleConfidenceFromAts(ats), [ats]);
  const readiness = useMemo(() => resumeReadinessFromData(data, ats), [data, ats]);
  const tasks = useMemo(() => optimizationTasks(data, ats), [data, ats]);
  const roadmapItems = useMemo(() => roadmapFromOptimization(data), [data]);

  const completedTitles = useMemo(() => getCompletedTaskTitles(tasks, checked), [tasks, checked]);
  const completedTasks = useMemo(
    () => tasks.filter((task) => completedTitles.has(task.title.toLowerCase().trim())),
    [tasks, completedTitles],
  );
  const pendingRoadmapItems = useMemo(
    () => filterPendingRoadmapItems(roadmapItems, completedTitles),
    [roadmapItems, completedTitles],
  );
  const simulator = data.atsSimulator;
  const preview = useMemo(
    () => simulatorPreview(simulator.currentScore, simulator.projectedScore, pendingRoadmapItems, completedTasks),
    [simulator.currentScore, simulator.projectedScore, pendingRoadmapItems, completedTasks],
  );

  const handleReanalyze = useCallback(async () => {
    if (!onReanalyze) return;
    setReanalyzeError(null);
    try {
      await onReanalyze();
      clearCheckedTasks(resumeId);
      setChecked(new Set());
      await reloadScores();
    } catch (err) {
      setReanalyzeError(err instanceof Error ? err.message : "Re-analyze failed");
    }
  }, [onReanalyze, resumeId, reloadScores]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
        Generating optimization report...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
        <p className="text-[12px] font-medium text-rose-200">Optimization unavailable</p>
        <p className="mt-1 text-[12px] text-rose-200/80">{error}</p>
      </div>
    );
  }

  const sectionEntries = Object.entries(data.sectionScores) as [keyof SectionScores, number][];
  const completedCount = completedTasks.length;
  const showReanalyzeBanner = preview.hasCompletedTasks || preview.allActionsComplete;

  const isEmpty =
    data.healthScore === 0 &&
    !data.strengths.length &&
    !data.improvements.length &&
    !simulator.actions.length;

  if (isEmpty && !ats.analysisReady) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center sm:px-6">
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-amber-300/50" />
        <p className="font-display text-[15px] font-medium text-white/80">Optimization pending</p>
        <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-5 text-white/45">
          Parse your resume first, then re-open this panel for health scores, readiness signals, and actionable tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Role Confidence + Readiness */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-violet-200/80">
            <ShieldCheck className="h-3.5 w-3.5 text-violet-300" />
            Role Confidence
          </div>
          <p className="font-display text-lg font-semibold text-white">{roleConfidence.role}</p>
          <p className="mt-1 text-[12px] text-white/55">{roleConfidence.source}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className={`font-display text-3xl font-semibold ${scoreColor(roleConfidence.confidence)}`}>
              {roleConfidence.confidence}%
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${roleConfidence.confidence}%` }}
                transition={{ duration: 0.7 }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
            <Briefcase className="h-3.5 w-3.5 text-cyan-300" />
            Resume Readiness
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <ReadinessBadge label="Internship Ready" ready={readiness.internshipReady} icon={GraduationCap} />
            <ReadinessBadge label="Full-Time Ready" ready={readiness.fullTimeReady} icon={Briefcase} />
            <ReadinessBadge label="Role Readiness" ready={readiness.roleReady} icon={Target} />
          </div>
        </div>
      </div>

      {/* Health Dashboard */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
          <Gauge className="h-3.5 w-3.5 text-violet-300" />
          Resume Health Dashboard
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Health Score" value={data.healthScore} icon={Activity} accent="text-violet-300" delay={0} />
          <MetricCard label="ATS Readiness" value={data.atsReadiness} icon={Target} accent="text-cyan-300" delay={0.05} />
          <MetricCard
            label="Keyword Coverage"
            value={data.keywordCoverage}
            icon={Sparkles}
            accent="text-amber-300"
            delay={0.1}
            suffix="%"
          />
          <MetricCard
            label="Recruiter Readability"
            value={data.recruiterReadability}
            icon={TrendingUp}
            accent="text-emerald-300"
            delay={0.15}
          />
        </div>
      </div>

      {/* Section Scores */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-white/45">Section Scores</div>
        {sectionEntries.every(([, v]) => v === 0) ? (
          <p className="text-[12px] text-white/45">Section scores appear after resume parsing completes.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sectionEntries.map(([key, value], idx) => (
              <SectionScoreRow key={key} label={SECTION_LABELS[key]} value={value} delay={idx * 0.04} />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-emerald-200/80">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            Resume Strengths
          </div>
          {data.strengths.length === 0 ? (
            <p className="text-[12px] leading-5 text-white/45">
              Strengths will appear as your resume gains skills, projects, and measurable experience.
            </p>
          ) : (
            <ul className="list-disc space-y-1.5 pl-5 text-[12px] text-white/75 marker:text-emerald-300/70">
              {data.strengths.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-amber-200/80">
            <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
            Improvement Opportunities
          </div>
          {data.improvements.length === 0 ? (
            <p className="text-[12px] leading-5 text-white/45">
              No major gaps detected. Keep your resume aligned with your target role.
            </p>
          ) : (
            <ul className="list-disc space-y-1.5 pl-5 text-[12px] text-white/75 marker:text-amber-300/70">
              {data.improvements.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showReanalyzeBanner && (
        <ReanalyzeBanner
          completedCount={completedCount}
          totalTasks={tasks.length}
          estimatedGain={preview.completedGain}
          previewScore={preview.projectedScore}
          currentScore={preview.currentScore}
          allComplete={preview.allActionsComplete}
          isAnalyzing={isAnalyzing}
          onReanalyze={onReanalyze ? handleReanalyze : undefined}
          error={reanalyzeError}
        />
      )}

      {/* Checkable optimization tasks */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
            <ListChecks className="h-3.5 w-3.5 text-cyan-300" />
            Optimization Tasks
          </div>
          {tasks.length > 0 && (
            <span className="text-[10px] text-white/40">
              {completedCount}/{tasks.length} completed
            </span>
          )}
        </div>
        <CheckableTaskList
          items={tasks}
          checked={checked}
          onToggle={toggleTask}
          emptyMessage="All clear — no pending optimization tasks."
        />
      </div>

      {/* ATS Simulator + Roadmap */}
      <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-400/5 p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-cyan-200/80">
            <Target className="h-3.5 w-3.5 text-cyan-300" />
            ATS Improvement Simulator
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[12px] sm:gap-3">
            <span className="text-white/50">
              Current <span className={`font-semibold ${scoreColor(preview.currentScore)}`}>{preview.currentScore}</span>
            </span>
            <ArrowUpRight className="hidden h-3.5 w-3.5 text-cyan-300 sm:block" />
            <span className="text-white/50">
              {preview.allActionsComplete ? "Estimated after re-analyze" : "Projected"}{" "}
              <span className={`font-semibold ${scoreColor(preview.projectedScore)}`}>{preview.projectedScore}</span>
            </span>
            {preview.gainDelta > 0 && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-200">
                +{preview.gainDelta} pts {preview.allActionsComplete ? "estimated" : "possible"}
              </span>
            )}
          </div>
        </div>

        {preview.allActionsComplete ? (
          <p className="mb-3 text-[12px] leading-5 text-white/50">
            All simulator actions are marked complete. Scores above are estimates until you update your resume and
            re-analyze.
          </p>
        ) : preview.hasCompletedTasks ? (
          <p className="mb-3 text-[12px] leading-5 text-white/50">
            Completed tasks are hidden from the simulator. Re-analyze after updating your resume to refresh your official
            ATS score.
          </p>
        ) : null}

        <ImprovementRoadmap
          items={pendingRoadmapItems}
          emptyMessage={
            preview.allActionsComplete
              ? "All actions complete — re-analyze to verify your new ATS score."
              : "No remaining simulator actions. Your projected ATS matches current performance."
          }
        />
      </div>
    </div>
  );
}

function ReanalyzeBanner({
  completedCount,
  totalTasks,
  estimatedGain,
  previewScore,
  currentScore,
  allComplete,
  isAnalyzing,
  onReanalyze,
  error,
}: {
  completedCount: number;
  totalTasks: number;
  estimatedGain: number;
  previewScore: number;
  currentScore: number;
  allComplete: boolean;
  isAnalyzing?: boolean;
  onReanalyze?: () => void;
  error?: string | null;
}) {
  return (
    <div className="rounded-xl border border-cyan-400/25 bg-gradient-to-r from-cyan-400/10 to-violet-400/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-cyan-200/90">
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-300 ${isAnalyzing ? "animate-spin" : ""}`} />
            {allComplete ? "Tasks complete — verify your score" : "Changes pending verification"}
          </div>
          <p className="mt-2 text-[13px] leading-5 text-white/80">
            {allComplete
              ? `You've completed all ${totalTasks} optimization tasks. Update your resume PDF if needed, then re-analyze to apply changes to your official ATS score.`
              : `${completedCount} of ${totalTasks} tasks marked done. Checking tasks tracks progress only — re-analyze after editing your resume to refresh scores.`}
          </p>
          {estimatedGain > 0 && (
            <p className="mt-2 text-[12px] text-cyan-200/90">
              Estimated uplift: <span className="font-semibold">+{estimatedGain} ATS</span>
              {allComplete && (
                <>
                  {" "}
                  · projected <span className="font-semibold">{previewScore}</span> (from current {currentScore})
                </>
              )}
            </p>
          )}
          {error && <p className="mt-2 text-[12px] text-rose-300">{error}</p>}
        </div>
        {onReanalyze && (
          <button
            type="button"
            onClick={() => void onReanalyze()}
            disabled={isAnalyzing}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/15 px-4 py-2 text-[12px] font-medium text-cyan-100 transition-colors hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
            {isAnalyzing ? "Re-analyzing…" : "Re-analyze resume"}
          </button>
        )}
      </div>
    </div>
  );
}
