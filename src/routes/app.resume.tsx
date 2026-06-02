import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  BarChart3,
  Target,
  RefreshCw,
} from "lucide-react";
import { AtsIntelligencePanel } from "@/components/resume/AtsIntelligencePanel";
import { ResumeOptimizationPanel } from "@/components/resume/ResumeOptimizationPanel";
import { useRef, useState } from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AnalysisSummaryCards } from "@/components/resume/AnalysisSummaryCards";
import { ResumeAnalysisReport } from "@/components/resume/ResumeAnalysisReport";
import { useResume } from "@/hooks/useResume";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatFileSize, formatResumeDate, validateResumeFile } from "@/types/resume";
import type { Resume } from "@/types/resume";

export const Route = createFileRoute("/app/resume")({
  head: () => ({ meta: [{ title: "Resume Manager — Nexus" }] }),
  component: ResumeManager,
});

function ResumeManager() {
  const {
    resumes,
    activeResume,
    isLoading,
    isUploading,
    isAnalyzing,
    error,
    upload,
    analyze,
    activate,
    remove,
    download,
  } = useResume();
  const { notifyResumeUploaded } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [analysisResume, setAnalysisResume] = useState<Resume | null>(null);

  const hasResumes = resumes.length > 0;
  const displayError = localError ?? error;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateResumeFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    try {
      await upload(file);
      notifyResumeUploaded(file.name);
    } catch {
      // error set in store
    }
  };

  const handleActivate = async (id: string) => {
    setPendingId(id);
    setLocalError(null);
    try {
      await activate(id);
    } catch {
      // store handles error
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (!window.confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    setPendingId(id);
    setLocalError(null);
    try {
      await remove(id);
      if (analysisResume?.id === id) setAnalysisResume(null);
    } catch {
      // store handles error
    } finally {
      setPendingId(null);
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    setPendingId(id);
    setLocalError(null);
    try {
      await download(id, fileName);
    } catch {
      // store handles error
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="glass flex items-center justify-center gap-2 rounded-2xl p-12 text-sm text-white/60">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
        Loading resumes…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Resume Manager</div>
            <div className="font-display mt-1 text-xl font-semibold text-white">
              {hasResumes ? `${resumes.length} version${resumes.length === 1 ? "" : "s"}` : "No resumes yet"}
            </div>
            {activeResume && (
              <p className="mt-1 text-[12.5px] text-white/55">
                Active: <span className="text-white">{activeResume.title}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 px-4 py-2 text-[12.5px] font-medium text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.6)] disabled:opacity-70"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading & analyzing…
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" /> Upload Resume
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => void handleFileSelect(e)}
          />
        </div>
        <p className="mt-3 text-[12px] text-white/45">
          PDF only · Max 10 MB · Stored in Supabase · Parsed locally on upload (no AI)
        </p>
      </div>

      {displayError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[12.5px] text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {displayError}
        </div>
      )}

      {activeResume?.analysisSummary && activeResume.analysisStatus === "completed" && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span className="font-display text-[15px] font-semibold text-white">Active resume intelligence</span>
          </div>
          <AnalysisSummaryCards
            summary={activeResume.analysisSummary}
            status={activeResume.analysisStatus}
          />
          <button
            type="button"
            onClick={() => setAnalysisResume(activeResume)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-[12px] text-cyan-200"
          >
            <BarChart3 className="h-3.5 w-3.5" /> View Analysis
          </button>
        </div>
      )}

      {activeResume && (
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-300" />
            <span className="font-display text-[15px] font-semibold text-white">ATS Intelligence Engine</span>
            <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] text-violet-200 ring-1 ring-violet-400/20">
              Rule-based
            </span>
          </div>
          <AtsIntelligencePanel resumeId={activeResume.id} />
        </div>
      )}

      {activeResume && (
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span className="font-display text-[15px] font-semibold text-white">Resume Optimization Engine</span>
            <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200 ring-1 ring-amber-400/20">
              Rule-based
            </span>
          </div>
          <ResumeOptimizationPanel resumeId={activeResume.id} />
        </div>
      )}

      {!hasResumes ? (
        <EmptyState
          icon={FileText}
          title="Upload your first resume."
          description="Add a PDF resume to extract skills, education, projects, experience, and certifications. Rule-based parsing — no AI required."
          actionLabel="Upload Resume"
          onAction={() => fileInputRef.current?.click()}
          className="glass border-white/5 py-16"
        />
      ) : (
        <div className="space-y-3">
          {resumes.map((resume, index) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`glass rounded-2xl p-4 ${
                resume.isActive ? "ring-1 ring-cyan-400/30" : ""
              }`}
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-600/20 ring-1 ring-white/10">
                  <FileText className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[15px] font-semibold text-white">{resume.title}</span>
                    {resume.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10.5px] font-medium text-cyan-200 ring-1 ring-cyan-400/25">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] text-white/50 ring-1 ring-white/10">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-[12px] text-white/45">{resume.fileName}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-white/40">
                    <span>Uploaded {formatResumeDate(resume.uploadedAt)}</span>
                    <span>{formatFileSize(resume.fileSize)}</span>
                  </div>
                  <AnalysisSummaryCards
                    summary={resume.analysisSummary}
                    status={resume.analysisStatus}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(resume.analysisStatus === "pending" ||
                    resume.analysisStatus === "failed" ||
                    !resume.analysisSummary?.skillsCount) && (
                    <ActionButton
                      label={isAnalyzing ? "Analyzing…" : "Re-analyze"}
                      icon={RefreshCw}
                      disabled={pendingId === resume.id || isAnalyzing}
                      onClick={() => {
                        setPendingId(resume.id);
                        void analyze(resume.id).finally(() => setPendingId(null));
                      }}
                    />
                  )}
                  <ActionButton
                    label="View Analysis"
                    icon={BarChart3}
                    disabled={pendingId === resume.id}
                    onClick={() => setAnalysisResume(resume)}
                  />
                  <ActionButton
                    label="Download"
                    icon={Download}
                    disabled={pendingId === resume.id}
                    onClick={() => void handleDownload(resume.id, resume.fileName)}
                  />
                  {!resume.isActive && (
                    <ActionButton
                      label="Activate"
                      icon={CheckCircle2}
                      disabled={pendingId === resume.id}
                      onClick={() => void handleActivate(resume.id)}
                    />
                  )}
                  <ActionButton
                    label="Delete"
                    icon={Trash2}
                    variant="danger"
                    disabled={pendingId === resume.id}
                    onClick={() => void handleDelete(resume.id, resume.fileName)}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {hasResumes && resumes.length > 1 && (
        <div className="glass rounded-2xl border border-dashed border-white/10 p-4 text-[12.5px] text-white/55">
          <span className="font-medium text-white">Multiple versions</span> — Only one resume is active at a time.
          Use <span className="text-cyan-300">Activate</span> to switch which file Nexus uses for future application flows.
        </div>
      )}

      <div className="text-center text-[11.5px] text-white/35">
        Need to update career details?{" "}
        <Link to="/app/profile" className="text-cyan-300 hover:text-cyan-200">
          Open profile
        </Link>
      </div>

      {analysisResume && (
        <ResumeAnalysisReport resume={analysisResume} onClose={() => setAnalysisResume(null)} />
      )}
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11.5px] disabled:opacity-50 ${
        variant === "danger"
          ? "border-rose-500/20 bg-rose-500/5 text-rose-200 hover:bg-rose-500/10"
          : "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]"
      }`}
    >
      {disabled ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}
