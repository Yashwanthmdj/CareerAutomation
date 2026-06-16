import { Building2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Application } from "@/types/application";
import { applicationStatusBadgeClass } from "@/types/application";
import { formatSourceType } from "@/types/opportunity";
import { matchScoreBadgeClass } from "@/types/opportunityMatch";

type Props = {
  application: Application;
  dragging?: boolean;
  onDragStart: (applicationId: string) => void;
  onDragEnd: () => void;
};

function formatAppliedDate(application: Application): string | null {
  const value =
    application.appliedAt ??
    application.assessmentAt ??
    application.interviewAt ??
    application.offerAt ??
    application.rejectedAt ??
    application.createdAt;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ApplicationKanbanCard({ application, dragging = false, onDragStart, onDragEnd }: Props) {
  const appliedLabel = formatAppliedDate(application);

  return (
    <article
      draggable
      onDragStart={() => onDragStart(application.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-xl border border-white/10 bg-white/[0.03] p-3.5 shadow-[0_14px_36px_-28px_rgba(0,0,0,0.85)]",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.05]",
        "hover:shadow-[0_18px_42px_-22px_rgba(99,102,241,0.28)]",
        dragging && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20 group-hover:text-white/40" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">
            {application.opportunity.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-white/55">
            <Building2 className="h-3 w-3 shrink-0 text-white/35" />
            <span className="truncate">{application.opportunity.company}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-white/55">
          {formatSourceType(application.opportunity.sourceType)}
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em]",
            applicationStatusBadgeClass(application.status),
          )}
        >
          {application.status}
        </span>
        {application.matchScore != null && (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[9px] font-semibold",
              matchScoreBadgeClass(application.matchScore),
            )}
          >
            {application.matchScore}% match
          </span>
        )}
      </div>

      {appliedLabel && (
        <p className="mt-2.5 text-[10px] text-white/40">
          Updated {appliedLabel}
        </p>
      )}
    </article>
  );
}
