export type SkillNormalizationItem = {
  raw: string;
  normalized: string;
};

export type FamilyMatchItem = {
  targetSkill: string;
  resumeSkill: string;
  family: string;
};

export type ScoreBreakdownItem = {
  category: string;
  label: string;
  score: number;
  weight: number;
  detail: string;
};

export type AtsIntelligence = {
  atsScore: number;
  grade: string;
  scoreBreakdown: ScoreBreakdownItem[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  targetRole: string;
  detectedRole: string;
  roleDetectionSource: string;
  matchedSkills: string[];
  directMatches: string[];
  familyMatches: FamilyMatchItem[];
  targetSkillSet: string[];
  resumeSkillsNormalized: SkillNormalizationItem[];
  targetSkillsNormalized: SkillNormalizationItem[];
  resumeSkillCount: number;
  targetSkillCount: number;
  analysisReady: boolean;
};

export const EMPTY_ATS: AtsIntelligence = {
  atsScore: 0,
  grade: "",
  scoreBreakdown: [],
  missingSkills: [],
  strengths: [],
  weaknesses: [],
  recommendations: [],
  targetRole: "",
  detectedRole: "",
  roleDetectionSource: "",
  matchedSkills: [],
  directMatches: [],
  familyMatches: [],
  targetSkillSet: [],
  resumeSkillsNormalized: [],
  targetSkillsNormalized: [],
  resumeSkillCount: 0,
  targetSkillCount: 0,
  analysisReady: false,
};

export function atsScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-300";
  if (score >= 70) return "text-cyan-300";
  if (score >= 55) return "text-amber-300";
  return "text-rose-300";
}

export function atsScoreRing(score: number): string {
  if (score >= 85) return "from-emerald-500 to-teal-400";
  if (score >= 70) return "from-cyan-500 to-indigo-500";
  if (score >= 55) return "from-amber-500 to-orange-400";
  return "from-rose-500 to-orange-500";
}
