import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

export const Route = createFileRoute("/app/applications")({
  head: () => ({ meta: [{ title: "Applications — Nexus" }] }),
  component: Applications,
});

const columns = [
  { name: "Saved", items: [["Discord","Staff Eng"],["Figma","Sr Designer"]] },
  { name: "Applied", items: [["Stripe","Senior PM"],["Vercel","DX Eng"],["Notion","AI Lead"]] },
  { name: "Interview", items: [["Anthropic","Research Eng"],["Linear","Founding Designer"]] },
  { name: "Offer", items: [["OpenAI","Forward Deployed"]] },
  { name: "Rejected", items: [["Google","L5 PM"]] },
];

function Applications() {
  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div key={col.name} className="w-72 flex-none">
            <div className="flex items-center justify-between px-1">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/60">{col.name}</div>
              <div className="text-[11px] text-white/40">{col.items.length}</div>
            </div>
            <div className="mt-3 space-y-2">
              {col.items.map(([c, r], i) => (
                <motion.div key={i} whileHover={{ y: -3 }} className="glass cursor-grab rounded-xl p-3.5 active:cursor-grabbing">
                  <div className="text-[13.5px] font-medium text-white">{r}</div>
                  <div className="mt-0.5 text-[12px] text-white/50">{c}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {[0,1,2].map(k => <div key={k} className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-[#050816]" />)}
                    </div>
                    <div className="text-[10.5px] uppercase tracking-[0.12em] text-white/40">2d ago</div>
                  </div>
                </motion.div>
              ))}
              <button className="w-full rounded-xl border border-dashed border-white/10 py-2 text-[12px] text-white/40 hover:border-white/20 hover:text-white/70">+ Add card</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}