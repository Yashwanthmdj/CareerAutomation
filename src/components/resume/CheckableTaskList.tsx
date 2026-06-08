import { Check } from "lucide-react";
import type { RoadmapItem } from "@/utils/resumeIntelligence";
import { impactStyle } from "@/utils/resumeIntelligence";

type Props = {
  items: RoadmapItem[];
  checked: Set<string>;
  onToggle: (id: string) => void;
  emptyMessage?: string;
};

export function CheckableTaskList({ items, checked, onToggle, emptyMessage }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center">
        <p className="text-[12px] text-white/45">
          {emptyMessage ?? "No optimization tasks right now. Your resume is in great shape."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isChecked = checked.has(item.id);
        return (
          <label
            key={item.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
              isChecked
                ? "border-emerald-400/20 bg-emerald-400/5"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={isChecked}
              onChange={() => onToggle(item.id)}
            />
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                isChecked
                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                  : "border-white/25 bg-transparent text-transparent"
              }`}
            >
              <Check className="h-3 w-3" />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-[12.5px] leading-5 ${
                  isChecked ? "text-white/45 line-through" : "text-white/85"
                }`}
              >
                {item.title}
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${impactStyle(item.impact)}`}>
                  {item.impact} Impact
                </span>
                <span className="text-[10px] text-cyan-200/80">+{item.estimatedGain} ATS</span>
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
