export const MAX_RESUME_BYTES = 10 * 1024 * 1024;
export const ALLOWED_RESUME_MIME = "application/pdf";

const BLOCKED_EXTENSIONS = [".doc", ".docx", ".txt", ".zip", ".rtf", ".odt"];

import type { AnalysisSummary } from "@/types/resumeAnalysis";

export type Resume = {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  supabaseObjectKey: string;
  isActive: boolean;
  uploadedAt: string;
  updatedAt: string;
  analysisStatus?: "pending" | "completed" | "failed" | null;
  analysisSummary?: AnalysisSummary | null;
};

export type ResumeSummary = {
  activeResumeTitle: string | null;
  activeResumeFileName: string | null;
  activeResumeUploadedAt: string | null;
  resumeCount: number;
};

export function validateResumeFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  for (const ext of BLOCKED_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      return `Only PDF files are allowed. "${ext}" files are not supported.`;
    }
  }
  if (!lower.endsWith(".pdf")) {
    return "Only PDF files are allowed. Please upload a .pdf file.";
  }
  if (file.type && file.type !== ALLOWED_RESUME_MIME && file.type !== "application/x-pdf") {
    return "Only PDF files are allowed.";
  }
  if (file.size === 0) {
    return "File is empty.";
  }
  if (file.size > MAX_RESUME_BYTES) {
    return "File exceeds the 10 MB maximum size.";
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatResumeDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
