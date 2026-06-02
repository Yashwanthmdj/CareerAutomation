export type OptimizationPriority = "High" | "Medium" | "Low";

export type OptimizationItem = {
  priority: OptimizationPriority;
  title: string;
  recommendation: string;
  rationale: string;
  estimatedGain: number;
};

export type ResumeOptimization = {
  healthScore: number;
  estimatedAtsGain: number;
  optimizationItems: OptimizationItem[];
  sectionScores: Record<string, number>;
  keywordGaps: string[];
  impactSummary: string;
};

export const EMPTY_RESUME_OPTIMIZATION: ResumeOptimization = {
  healthScore: 0,
  estimatedAtsGain: 0,
  optimizationItems: [],
  sectionScores: {},
  keywordGaps: [],
  impactSummary: "",
};
