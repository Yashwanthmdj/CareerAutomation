export type AnalysisStatus = "pending" | "completed" | "failed";

export type AnalysisSummary = {
  skillsCount: number;
  projectsCount: number;
  educationCount: number;
  experienceCount: number;
  certificationsCount: number;
};

export type ExtractedSkill = { id: string; skill: string };

export type ExtractedEducation = {
  id: string;
  college: string | null;
  degree: string | null;
  graduationYear: string | null;
  cgpa: string | null;
};

export type ExtractedProject = {
  id: string;
  projectName: string;
  description: string | null;
  technologies: string | null;
};

export type ExtractedExperience = {
  id: string;
  company: string | null;
  role: string | null;
  duration: string | null;
  description: string | null;
};

export type ExtractedCertification = {
  id: string;
  certificationName: string;
};

export type ResumeAnalysis = {
  status: AnalysisStatus;
  skills: ExtractedSkill[];
  education: ExtractedEducation[];
  projects: ExtractedProject[];
  experience: ExtractedExperience[];
  certifications: ExtractedCertification[];
  rawText: string | null;
  summary: AnalysisSummary;
  analyzedAt: string | null;
  errorMessage: string | null;
};

export const EMPTY_ANALYSIS_SUMMARY: AnalysisSummary = {
  skillsCount: 0,
  projectsCount: 0,
  educationCount: 0,
  experienceCount: 0,
  certificationsCount: 0,
};
