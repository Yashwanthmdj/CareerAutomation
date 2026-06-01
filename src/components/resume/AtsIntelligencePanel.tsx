import { motion } from "motion/react";
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Loader2,
  ChevronRight,
  MinusCircle,
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

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-start gap-6">
        <div className="relative grid h-28 w-28 shrink-0 place-items-center">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br opacity-30 ${atsScoreRing(scorePct)}`}
          />
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-[#0a0f1a] ring-2 ring-white/10">
            <span className={`font-display text-3xl font-bold ${atsScoreColor(scorePct)}`}>
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
            <span className="font-display text-[15px] font-semibold text-white">ATS Intelligence</span>
            {ats.grade && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] text-white/60 ring-1 ring-white/10">
                {ats.grade}
              </span>
            )}
          </div>
          {(ats.detectedRole || ats.targetRole) && (
            <p className="mt-1 text-[12px] text-white/45">
              Detected resume role:{" "}
              <span className="text-violet-200">{ats.detectedRole || ats.targetRole}</span>
            </p>
          )}
          {ats.roleDetectionSource && (
            <p className="mt-0.5 text-[11px] text-white/35">via {ats.roleDetectionSource}</p>
          )}
          <p className="mt-2 text-[12px] text-white/50">
            {ats.resumeSkillCount} resume skills · {ats.targetSkillCount} role target skills · rule-based
          </p>
          {!compact && ats.recommendations[0] && (
            <p className="mt-2 text-[12px] text-cyan-200/80">{ats.recommendations[0]}</p>
          )}
        </div>
      </div>

      {!compact && ats.scoreBreakdown.length > 0 && (
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/45">Score breakdown</div>
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
                {item.detail && (
                  <p className="mt-0.5 text-[10.5px] text-white/35">{item.detail}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!compact && (ats.matchedSkills.length > 0 || ats.targetSkillSet.length > 0) && (
        <div className="rounded-xl border border-violet-400/15 bg-violet-400/5 p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">ATS diagnostics</div>
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

      {!compact && ats.resumeSkillsNormalized.length > 0 && (
        <NormalizationTable title="Resume skills (raw → normalized)" rows={ats.resumeSkillsNormalized} />
      )}

      {!compact && ats.targetSkillsNormalized.length > 0 && (
        <NormalizationTable title="Target skills (raw → normalized)" rows={ats.targetSkillsNormalized} />
      )}

      {!compact && (
        <div className="grid gap-4 sm:grid-cols-2">
          <InsightList
            title="Strengths"
            icon={TrendingUp}
            items={ats.strengths}
            emptyLabel="Complete resume parsing to surface strengths."
            accent="emerald"
          />
          <InsightList
            title="Weaknesses"
            icon={AlertTriangle}
            items={ats.weaknesses}
            emptyLabel="No major gaps detected."
            accent="amber"
          />
        </div>
      )}

      {!compact && ats.missingSkills.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-white/45">
            <MinusCircle className="h-3.5 w-3.5" />
            Missing skills (for detected role)
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
            Recommendations
          </div>
          <ul className="space-y-1.5 text-[12px] text-white/65">
            {ats.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400/70" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
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
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
  emptyLabel: string;
  accent: "emerald" | "amber";
}) {
  const border = accent === "emerald" ? "border-emerald-400/15" : "border-amber-400/15";
  const iconColor = accent === "emerald" ? "text-emerald-300" : "text-amber-300";

  return (
    <div className={`rounded-xl border ${border} bg-white/[0.02] p-3`}>
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/80">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        {title}
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-[11.5px] text-white/40">{emptyLabel}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-[11.5px] text-white/60">
          {items.map((item, i) => (
            <li key={i} className="flex gap-1.5">
              <span className={iconColor}>•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
