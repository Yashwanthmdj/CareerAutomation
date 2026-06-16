import type { Opportunity } from "@/types/opportunity";

export type MatchLevel = "EXCELLENT" | "STRONG" | "GOOD" | "FAIR" | "LOW";

export type OpportunityMatch = {
  opportunityId: string;
  matchScore: number;
  matchLevel: MatchLevel;
  matchedSkills: string[];
  missingSkills: string[];
  analysisReady: boolean;
  message?: string | null;
};

export type OpportunityRecommendation = {
  opportunity: Opportunity;
  matchScore: number;
  matchLevel: MatchLevel;
  matchedSkills: string[];
  missingSkills: string[];
};

export type OpportunityRecommendationList = {
  recommendations: OpportunityRecommendation[];
  total: number;
  analysisReady: boolean;
  resumeId?: string | null;
  message?: string | null;
};

export function matchLevelColor(level: MatchLevel): string {
  switch (level) {
    case "EXCELLENT":
      return "text-emerald-300";
    case "STRONG":
      return "text-cyan-300";
    case "GOOD":
      return "text-indigo-300";
    case "FAIR":
      return "text-amber-300";
    default:
      return "text-rose-300";
  }
}

export function matchScoreBadgeClass(score: number): string {
  if (score >= 90) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (score >= 75) return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
  if (score >= 60) return "border-indigo-400/30 bg-indigo-400/10 text-indigo-200";
  if (score >= 40) return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-rose-400/30 bg-rose-400/10 text-rose-200";
}
