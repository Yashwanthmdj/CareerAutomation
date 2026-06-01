import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Inbox } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { ApplicationStage } from "@/types/workspace";

export const Route = createFileRoute("/app/applications")({
  head: () => ({ meta: [{ title: "Applications — Nexus" }] }),
  component: Applications,
});

const COLUMNS: { name: string; stage: ApplicationStage }[] = [
  { name: "Saved", stage: "saved" },
  { name: "Applied", stage: "applied" },
  { name: "Interview", stage: "interview" },
  { name: "Offer", stage: "offer" },
];

function Applications() {
  const { workspace } = useWorkspace();
  const hasAny = workspace.applications.length > 0;

  if (!hasAny) {
    return (
      <>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNS.map((col) => (
            <div key={col.stage} className="w-72 flex-none">
              <div className="flex items-center justify-between px-1">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/60">{col.name}</div>
                <div className="text-[11px] text-white/40">0</div>
              </div>
              <div className="mt-3">
                <div className="glass rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <p className="text-[12px] text-white/40">No {col.name.toLowerCase()} applications</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <EmptyState
            icon={Inbox}
            title="Your application tracker is empty"
            description="Applications will appear here when you save or apply to opportunities. Kanban columns stay ready for your pipeline."
            actionLabel="Browse opportunities"
            actionTo="/app/opportunities"
          />
        </div>
      </>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const items = workspace.applications.filter((a) => a.stage === col.stage);
        return (
          <div key={col.stage} className="w-72 flex-none">
            <div className="flex items-center justify-between px-1">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/60">{col.name}</div>
              <div className="text-[11px] text-white/40">{items.length}</div>
            </div>
            <div className="mt-3 space-y-2">
              {items.map((app) => (
                <motion.div
                  key={app.id}
                  whileHover={{ y: -3 }}
                  className="glass cursor-grab rounded-xl p-3.5 active:cursor-grabbing"
                >
                  <div className="text-[13.5px] font-medium text-white">{app.role}</div>
                  <div className="mt-0.5 text-[12px] text-white/50">{app.company}</div>
                </motion.div>
              ))}
              <div className="w-full rounded-xl border border-dashed border-white/10 py-2 text-center text-[12px] text-white/30">
                Drop applications here
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
