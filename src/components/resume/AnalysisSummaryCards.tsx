import { GraduationCap, Briefcase, FolderKanban, Award, Code2 } from "lucide-react";
import type { AnalysisSummary } from "@/types/resumeAnalysis";
import { EMPTY_ANALYSIS_SUMMARY } from "@/types/resumeAnalysis";

const CARDS = [
  { key: "skillsCount" as const, label: "Skills Found", icon: Code2, accent: "text-cyan-300" },
  { key: "projectsCount" as const, label: "Projects Found", icon: FolderKanban, accent: "text-violet-300" },
  { key: "educationCount" as const, label: "Education Found", icon: GraduationCap, accent: "text-indigo-300" },
  { key: "experienceCount" as const, label: "Experience Found", icon: Briefcase, accent: "text-emerald-300" },
  { key: "certificationsCount" as const, label: "Certifications Found", icon: Award, accent: "text-amber-300" },
];

export function AnalysisSummaryCards({
  summary,
  status,
}: {
  summary?: AnalysisSummary | null;
  status?: string | null;
}) {
  const data = summary ?? EMPTY_ANALYSIS_SUMMARY;
  const pending = !status || status === "pending";
  const failed = status === "failed";

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">Resume Analysis</span>
        {pending && (
          <span className="text-[10.5px] text-amber-200/80">Analysis pending</span>
        )}
        {failed && (
          <span className="text-[10.5px] text-amber-200/80">Limited extraction</span>
        )}
        {status === "completed" && (
          <span className="text-[10.5px] text-emerald-300/80">Parsed</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map(({ key, label, icon: Icon, accent }) => (
          <div
            key={key}
            className="rounded-xl border border-white/5 bg-white/[0.02] px-2.5 py-2.5 text-center"
          >
            <Icon className={`mx-auto h-3.5 w-3.5 ${accent}`} />
            <div className="mt-1 font-display text-lg font-semibold text-white">{data[key]}</div>
            <div className="text-[9.5px] leading-tight text-white/40">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
