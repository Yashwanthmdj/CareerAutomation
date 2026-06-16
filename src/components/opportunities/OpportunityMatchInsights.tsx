import type { OpportunityMatch } from "@/types/opportunityMatch";
import { matchLevelColor, matchScoreBadgeClass } from "@/types/opportunityMatch";

type Props = {
  match: OpportunityMatch;
  compact?: boolean;
};

export function OpportunityMatchInsights({ match, compact = false }: Props) {
  if (!match.analysisReady) {
    return (
      <p className="mt-3 text-[11px] text-white/40">
        {match.message ?? "Upload and analyze a resume to see match insights."}
      </p>
    );
  }

  return (
    <div className={compact ? "mt-3 space-y-2" : "mt-4 space-y-3"}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${matchScoreBadgeClass(match.matchScore)}`}
        >
          {match.matchScore}% match
        </span>
        <span className={`text-[10px] uppercase tracking-[0.14em] ${matchLevelColor(match.matchLevel)}`}>
          {match.matchLevel}
        </span>
      </div>

      {match.matchedSkills.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-300/80">Matched skills</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(compact ? match.matchedSkills.slice(0, 3) : match.matchedSkills).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {match.missingSkills.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-rose-300/80">Missing skills</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(compact ? match.missingSkills.slice(0, 3) : match.missingSkills).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[10px] text-rose-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
