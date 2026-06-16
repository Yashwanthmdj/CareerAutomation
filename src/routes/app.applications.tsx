import { createFileRoute } from "@tanstack/react-router";
import { ApplicationKanbanBoard } from "@/components/applications/ApplicationKanbanBoard";

export const Route = createFileRoute("/app/applications")({
  head: () => ({ meta: [{ title: "Applications — Nexus" }] }),
  component: Applications,
});

function Applications() {
  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Phase 3.8</div>
        <h1 className="font-display mt-1 text-xl font-semibold text-white">Application tracker</h1>
        <p className="mt-1 text-[13px] text-white/50">
          Drag cards across stages to update your pipeline. Changes save automatically.
        </p>
      </div>
      <ApplicationKanbanBoard />
    </div>
  );
}
