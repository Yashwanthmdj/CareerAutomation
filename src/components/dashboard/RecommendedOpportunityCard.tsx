import { ArrowUpRight, Building2, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchLevel, OpportunityRecommendation } from "@/types/opportunityMatch";
import { matchLevelColor, matchScoreBadgeClass } from "@/types/opportunityMatch";
import { formatOpportunityType } from "@/types/opportunity";

type Props = {
  recommendation: OpportunityRecommendation;
};

function matchAccentGradient(level: MatchLevel): string {
  switch (level) {
    case "EXCELLENT":
      return "from-emerald-500/15 via-transparent to-transparent";
    case "STRONG":
      return "from-cyan-500/15 via-transparent to-transparent";
    case "GOOD":
      return "from-indigo-500/15 via-transparent to-transparent";
    case "FAIR":
      return "from-amber-500/12 via-transparent to-transparent";
    default:
      return "from-rose-500/10 via-transparent to-transparent";
  }
}

function scoreRingClass(score: number): string {
  if (score >= 90) return "border-emerald-400/35 bg-emerald-400/10 text-emerald-100";
  if (score >= 75) return "border-cyan-400/35 bg-cyan-400/10 text-cyan-100";
  if (score >= 60) return "border-indigo-400/35 bg-indigo-400/10 text-indigo-100";
  if (score >= 40) return "border-amber-400/35 bg-amber-400/10 text-amber-100";
  return "border-rose-400/35 bg-rose-400/10 text-rose-100";
}

export function RecommendedOpportunityCard({ recommendation }: Props) {
  const { opportunity, matchScore, matchLevel, matchedSkills } = recommendation;

  return (
    <article
      className={cn(
        "group relative flex h-[212px] flex-col overflow-hidden rounded-2xl border border-white/10",
        "bg-white/[0.03] shadow-[0_18px_48px_-30px_rgba(0,0,0,0.9)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.045]",
        "hover:shadow-[0_26px_56px_-22px_rgba(99,102,241,0.32)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
          matchAccentGradient(matchLevel),
        )}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_55%)]" />

      <div className="relative flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-white/65">
              {formatOpportunityType(opportunity.opportunityType)}
            </span>
            <h3 className="mt-2 line-clamp-2 font-display text-[15px] font-semibold leading-snug text-white">
              {opportunity.title}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/55">
              <Building2 className="h-3 w-3 shrink-0 text-white/35" />
              <span className="truncate">{opportunity.company}</span>
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-12 w-12 flex-col items-center justify-center rounded-xl border",
                scoreRingClass(matchScore),
              )}
            >
              <span className="text-[13px] font-bold leading-none">{matchScore}</span>
              <span className="mt-0.5 text-[8px] uppercase tracking-[0.08em] opacity-80">match</span>
            </div>
            <span className={cn("text-[9px] font-semibold uppercase tracking-[0.14em]", matchLevelColor(matchLevel))}>
              {matchLevel}
            </span>
          </div>
        </div>

        {matchedSkills.length > 0 ? (
          <div className="mt-3 flex min-h-[24px] flex-wrap gap-1.5">
            {matchedSkills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-100"
              >
                <Sparkles className="h-2.5 w-2.5 opacity-70" />
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-3 min-h-[24px] text-[10px] text-white/35">No matched skills yet</div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/8 pt-3">
          <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-white/50">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-white/35" />
            <span className="truncate">{opportunity.location || "Remote"}</span>
          </div>

          {opportunity.applyLink ? (
            <a
              href={opportunity.applyLink}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold",
                "border border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
                "transition hover:border-cyan-400/50 hover:bg-cyan-400/18 hover:text-white",
              )}
            >
              Apply
              <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          ) : (
            <span
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px]",
                matchScoreBadgeClass(matchScore),
              )}
            >
              View details
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
