import { motion } from "motion/react";
import {
  X,
  Sparkles,
  GraduationCap,
  Briefcase,
  FolderKanban,
  Award,
  Code2,
  FileText,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { resumeService } from "@/services/resume/resumeService";
import type { Resume } from "@/types/resume";
import type { ResumeAnalysis } from "@/types/resumeAnalysis";
import { EMPTY_ANALYSIS_SUMMARY } from "@/types/resumeAnalysis";

const TABS = [
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "raw", label: "Raw Text", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ResumeAnalysisReport({
  resume,
  onClose,
}: {
  resume: Resume;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabId>("skills");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    resumeService
      .getAnalysis(resume.id)
      .then(setAnalysis)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analysis"))
      .finally(() => setLoading(false));
  }, [resume.id]);

  const summary = analysis?.summary ?? resume.analysisSummary ?? EMPTY_ANALYSIS_SUMMARY;
  const status = analysis?.status ?? resume.analysisStatus ?? "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl ring-1 ring-white/10"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/50">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              Resume Intelligence Report
            </div>
            <div className="font-display mt-1 text-lg font-semibold text-white">{resume.title}</div>
            <p className="mt-0.5 text-[12px] text-white/45">{resume.fileName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-3">
          <StatusBadge status={status} />
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] ${
                tab === id
                  ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/25"
                  : "text-white/55 hover:bg-white/5"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/55">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
              Loading analysis…
            </div>
          ) : error ? (
            <p className="text-[13px] text-rose-300">{error}</p>
          ) : (
            <TabContent tab={tab} analysis={analysis} status={status} />
          )}
        </div>

        <div className="grid grid-cols-5 gap-2 border-t border-white/10 p-4 text-center text-[10px] text-white/45">
          <Stat label="Skills" value={summary.skillsCount} />
          <Stat label="Projects" value={summary.projectsCount} />
          <Stat label="Education" value={summary.educationCount} />
          <Stat label="Experience" value={summary.experienceCount} />
          <Stat label="Certs" value={summary.certificationsCount} />
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] text-emerald-200 ring-1 ring-emerald-400/25">
        Analysis complete
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11px] text-amber-200 ring-1 ring-amber-400/25">
        Analysis pending — parsing could not extract structured data
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-white/55 ring-1 ring-white/10">
      Analysis pending
    </span>
  );
}

function TabContent({
  tab,
  analysis,
  status,
}: {
  tab: TabId;
  analysis: ResumeAnalysis | null;
  status: string;
}) {
  if (!analysis && status === "pending") {
    return (
      <p className="text-[13px] text-white/55">
        Resume uploaded successfully. Structured analysis is not available yet.
      </p>
    );
  }
  if (!analysis) return null;

  if (tab === "skills") {
    if (analysis.skills.length === 0) return <EmptyTab message="No skills matched from the skills library." />;
    return (
      <div className="flex flex-wrap gap-2">
        {analysis.skills.map((s) => (
          <span
            key={s.id}
            className="rounded-full bg-indigo-500/15 px-3 py-1 text-[12px] text-indigo-100 ring-1 ring-indigo-400/20"
          >
            {s.skill}
          </span>
        ))}
      </div>
    );
  }

  if (tab === "education") {
    if (analysis.education.length === 0) return <EmptyTab message="No education sections detected." />;
    return (
      <div className="space-y-3">
        {analysis.education.map((e) => (
          <Card key={e.id}>
            {e.college && <div className="font-medium text-white">{e.college}</div>}
            {e.degree && <div className="text-[12.5px] text-white/70">{e.degree}</div>}
            <div className="mt-1 flex flex-wrap gap-3 text-[11.5px] text-white/45">
              {e.graduationYear && <span>Year: {e.graduationYear}</span>}
              {e.cgpa && <span>CGPA: {e.cgpa}</span>}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (tab === "projects") {
    if (analysis.projects.length === 0) return <EmptyTab message="No projects detected." />;
    return (
      <div className="space-y-3">
        {analysis.projects.map((p) => (
          <Card key={p.id}>
            <div className="font-medium text-white">{p.projectName}</div>
            {p.technologies && (
              <div className="mt-1 text-[11.5px] text-cyan-300/80">{p.technologies}</div>
            )}
            {p.description && (
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">{p.description}</p>
            )}
          </Card>
        ))}
      </div>
    );
  }

  if (tab === "experience") {
    if (analysis.experience.length === 0) return <EmptyTab message="No experience sections detected." />;
    return (
      <div className="space-y-3">
        {analysis.experience.map((e) => (
          <Card key={e.id}>
            <div className="font-medium text-white">{e.role ?? "Role"}</div>
            {e.company && <div className="text-[12.5px] text-white/70">{e.company}</div>}
            {e.duration && <div className="mt-1 text-[11px] text-white/45">{e.duration}</div>}
            {e.description && (
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">{e.description}</p>
            )}
          </Card>
        ))}
      </div>
    );
  }

  if (tab === "certifications") {
    if (analysis.certifications.length === 0) {
      return <EmptyTab message="No certifications detected." />;
    }
    return (
      <ul className="space-y-2">
        {analysis.certifications.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] text-white/80"
          >
            {c.certificationName}
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "raw") {
    if (!analysis.rawText) return <EmptyTab message="No raw text stored." />;
    return (
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-[#0a0f1e] p-4 text-[11.5px] leading-relaxed text-white/65">
        {analysis.rawText}
      </pre>
    );
  }

  return null;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">{children}</div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return <p className="text-[13px] text-white/50">{message}</p>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-lg font-semibold text-white">{value}</div>
      <div>{label}</div>
    </div>
  );
}
