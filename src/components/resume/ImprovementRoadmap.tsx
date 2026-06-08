import { Sparkles } from "lucide-react";
import type { ImpactLevel, RoadmapItem } from "@/utils/resumeIntelligence";
import { groupRoadmapByImpact, impactStyle } from "@/utils/resumeIntelligence";

const IMPACT_ORDER: ImpactLevel[] = ["High", "Medium", "Low"];

type Props = {
  items: RoadmapItem[];
  emptyMessage?: string;
};

export function ImprovementRoadmap({ items, emptyMessage }: Props) {
  const grouped = groupRoadmapByImpact(items);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cyan-400/20 bg-cyan-400/5 px-4 py-6 text-center">
        <Sparkles className="mx-auto mb-2 h-5 w-5 text-cyan-300/60" />
        <p className="text-[12px] text-white/50">
          {emptyMessage ?? "No roadmap actions needed. Maintain your resume as you gain new experience."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {IMPACT_ORDER.map((impact) => {
        const bucket = grouped[impact];
        if (bucket.length === 0) return null;
        return (
          <div key={impact}>
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${impactStyle(impact)}`}>
                {impact} Impact
              </span>
              <span className="text-[10px] text-white/35">{bucket.length} action{bucket.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {bucket.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:flex sm:items-start sm:justify-between sm:gap-3"
                >
                  <p className="text-[12.5px] leading-5 text-white/80">{item.title}</p>
                  <span className="mt-2 inline-flex shrink-0 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-200 sm:mt-0">
                    +{item.estimatedGain} ATS
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
