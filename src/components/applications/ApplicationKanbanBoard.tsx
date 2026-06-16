import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApplicationKanbanCard } from "@/components/applications/ApplicationKanbanCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { applicationService } from "@/services/application/applicationService";
import { APPLICATION_COLUMNS, type Application, type ApplicationStatus } from "@/types/application";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export function ApplicationKanbanBoard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<ApplicationStatus | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await applicationService.list();
      setApplications(result.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(
      APPLICATION_COLUMNS.map((col) => [col.status, [] as Application[]]),
    ) as Record<ApplicationStatus, Application[]>;
    for (const app of applications) {
      map[app.status]?.push(app);
    }
    return map;
  }, [applications]);

  const handleDrop = async (applicationId: string, status: ApplicationStatus) => {
    const current = applications.find((app) => app.id === applicationId);
    if (!current || current.status === status) return;

    setApplications((prev) =>
      prev.map((app) => (app.id === applicationId ? { ...app, status } : app)),
    );
    setPendingId(applicationId);
    setError(null);

    try {
      const updated = await applicationService.updateStatus(applicationId, status);
      setApplications((prev) => prev.map((app) => (app.id === applicationId ? updated : app)));
    } catch (err) {
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? current : app)),
      );
      setError(err instanceof Error ? err.message : "Failed to update application status");
    } finally {
      setPendingId(null);
      setDropTarget(null);
      setDraggingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
        Loading application pipeline…
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Your application tracker is empty"
        description="Track opportunities from the Opportunities page to start building your pipeline."
        actionLabel="Browse opportunities"
        actionTo="/app/opportunities"
        className="py-10"
      />
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[12px] text-rose-200">
          {error}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {APPLICATION_COLUMNS.map((column) => {
          const items = grouped[column.status];
          const isTarget = dropTarget === column.status;

          return (
            <div key={column.status} className="w-[248px] shrink-0">
              <div className="flex items-center justify-between px-1">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/60">{column.label}</div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/45">
                  {items.length}
                </div>
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTarget(column.status);
                }}
                onDragLeave={() => setDropTarget((prev) => (prev === column.status ? null : prev))}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggingId) void handleDrop(draggingId, column.status);
                }}
                className={cn(
                  "mt-3 min-h-[220px] space-y-2 rounded-xl border p-2 transition-colors",
                  isTarget
                    ? "border-cyan-400/30 bg-cyan-400/[0.06]"
                    : "border-white/8 bg-white/[0.015]",
                )}
              >
                {items.map((application) => (
                  <ApplicationKanbanCard
                    key={application.id}
                    application={application}
                    dragging={draggingId === application.id || pendingId === application.id}
                    onDragStart={setDraggingId}
                    onDragEnd={() => setDraggingId(null)}
                  />
                ))}

                <div className="rounded-lg border border-dashed border-white/10 py-2 text-center text-[11px] text-white/30">
                  Drop here
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
