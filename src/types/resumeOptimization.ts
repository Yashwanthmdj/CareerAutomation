export type SectionScores = {
  summary: number;
  skills: number;
  projects: number;
  experience: number;
  education: number;
};

export type AtsSimulatorAction = {
  title: string;
  estimatedGain: number;
};

export type AtsSimulator = {
  currentScore: number;
  projectedScore: number;
  actions: AtsSimulatorAction[];
};

export type ResumeOptimization = {
  healthScore: number;
  atsReadiness: number;
  keywordCoverage: number;
  recruiterReadability: number;
  sectionScores: SectionScores;
  strengths: string[];
  improvements: string[];
  atsSimulator: AtsSimulator;
};

export const EMPTY_SECTION_SCORES: SectionScores = {
  summary: 0,
  skills: 0,
  projects: 0,
  experience: 0,
  education: 0,
};

export const EMPTY_RESUME_OPTIMIZATION: ResumeOptimization = {
  healthScore: 0,
  atsReadiness: 0,
  keywordCoverage: 0,
  recruiterReadability: 0,
  sectionScores: EMPTY_SECTION_SCORES,
  strengths: [],
  improvements: [],
  atsSimulator: {
    currentScore: 0,
    projectedScore: 0,
    actions: [],
  },
};
