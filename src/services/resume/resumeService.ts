import { apiClient } from "@/services/api/client";
import type { Resume, ResumeSummary } from "@/types/resume";
import type { ResumeAnalysis } from "@/types/resumeAnalysis";

type AnalysisSummaryApi = {
  skills_count: number;
  projects_count: number;
  education_count: number;
  experience_count: number;
  certifications_count: number;
};

type ResumeApi = {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  supabase_object_key: string;
  is_active: boolean;
  uploaded_at: string;
  updated_at: string;
  analysis_status?: string | null;
  analysis_summary?: AnalysisSummaryApi | null;
};

type ResumeAnalysisApi = {
  status: string;
  skills: { id: string; skill: string }[];
  education: {
    id: string;
    college: string | null;
    degree: string | null;
    graduation_year: string | null;
    cgpa: string | null;
  }[];
  projects: {
    id: string;
    project_name: string;
    description: string | null;
    technologies: string | null;
  }[];
  experience: {
    id: string;
    company: string | null;
    role: string | null;
    duration: string | null;
    description: string | null;
  }[];
  certifications: { id: string; certification_name: string }[];
  raw_text: string | null;
  summary: AnalysisSummaryApi;
  analyzed_at: string | null;
  error_message: string | null;
};

function mapSummary(data: AnalysisSummaryApi) {
  return {
    skillsCount: data.skills_count,
    projectsCount: data.projects_count,
    educationCount: data.education_count,
    experienceCount: data.experience_count,
    certificationsCount: data.certifications_count,
  };
}

function mapResume(data: ResumeApi): Resume {
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    fileName: data.file_name,
    fileSize: data.file_size,
    mimeType: data.mime_type,
    storagePath: data.storage_path,
    supabaseObjectKey: data.supabase_object_key,
    isActive: data.is_active,
    uploadedAt: data.uploaded_at,
    updatedAt: data.updated_at,
    analysisStatus: (data.analysis_status as Resume["analysisStatus"]) ?? null,
    analysisSummary: data.analysis_summary ? mapSummary(data.analysis_summary) : null,
  };
}

function mapAnalysis(data: ResumeAnalysisApi): ResumeAnalysis {
  return {
    status: data.status as ResumeAnalysis["status"],
    skills: data.skills.map((s) => ({ id: s.id, skill: s.skill })),
    education: data.education.map((e) => ({
      id: e.id,
      college: e.college,
      degree: e.degree,
      graduationYear: e.graduation_year,
      cgpa: e.cgpa,
    })),
    projects: data.projects.map((p) => ({
      id: p.id,
      projectName: p.project_name,
      description: p.description,
      technologies: p.technologies,
    })),
    experience: data.experience.map((e) => ({
      id: e.id,
      company: e.company,
      role: e.role,
      duration: e.duration,
      description: e.description,
    })),
    certifications: data.certifications.map((c) => ({
      id: c.id,
      certificationName: c.certification_name,
    })),
    rawText: data.raw_text,
    summary: mapSummary(data.summary),
    analyzedAt: data.analyzed_at,
    errorMessage: data.error_message,
  };
}

function buildSummary(resumes: Resume[]): ResumeSummary {
  const active = resumes.find((r) => r.isActive) ?? null;
  return {
    activeResumeTitle: active?.title ?? null,
    activeResumeFileName: active?.fileName ?? null,
    activeResumeUploadedAt: active?.uploadedAt ?? null,
    resumeCount: resumes.length,
  };
}

export const resumeService = {
  async list(): Promise<Resume[]> {
    const data = await apiClient.get<{ resumes: ResumeApi[]; total: number }>("/resumes");
    return (data.resumes ?? []).map(mapResume);
  },

  async getActive(): Promise<Resume | null> {
    const data = await apiClient.get<{ resume: ResumeApi | null }>("/resumes/active");
    return data.resume ? mapResume(data.resume) : null;
  },

  async getById(id: string): Promise<Resume> {
    const data = await apiClient.get<ResumeApi>(`/resumes/${id}`);
    return mapResume(data);
  },

  async upload(file: File, title?: string): Promise<{ resume: Resume; analysisStatus: string }> {
    const form = new FormData();
    form.append("file", file);
    if (title?.trim()) form.append("title", title.trim());
    const data = await apiClient.upload<{ resume: ResumeApi; analysis_status: string }>(
      "/resumes/upload",
      form,
    );
    return { resume: mapResume(data.resume), analysisStatus: data.analysis_status };
  },

  async getAnalysis(id: string): Promise<ResumeAnalysis> {
    const data = await apiClient.get<ResumeAnalysisApi>(`/resumes/${id}/analysis`);
    return mapAnalysis(data);
  },

  async activate(id: string): Promise<Resume> {
    const data = await apiClient.post<{ resume: ResumeApi }>(`/resumes/${id}/activate`);
    return mapResume(data.resume);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/resumes/${id}`);
  },

  async download(id: string, fileName: string): Promise<void> {
    const blob = await apiClient.downloadBlob(`/resumes/${id}/download`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  buildSummary,
};
