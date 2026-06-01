import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";

export function ChartPlaceholder({ message }: { message: string }) {
  const w = 600;
  const h = 160;
  const ghost = [8, 12, 10, 14, 11, 9, 13, 10, 12, 8, 11, 9];
  const max = Math.max(...ghost);
  const step = w / (ghost.length - 1);
  const d = ghost
    .map((p, i) => `${i ? "L" : "M"}${i * step},${h - (p / max) * h * 0.4}`)
    .join(" ");

  return (
    <div className="relative mt-6">
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full opacity-40">
        <defs>
          <linearGradient id="chartGhost" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(99,102,241,0.25)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0)" />
          </linearGradient>
        </defs>
        <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#chartGhost)" />
        <path d={d} stroke="rgba(165,180,252,0.35)" strokeWidth="1.5" fill="none" strokeDasharray="6 8" />
      </svg>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2"
      >
        <BarChart3 className="h-5 w-5 text-white/30" />
        <p className="max-w-xs text-center text-[13px] text-white/50">{message}</p>
      </motion.div>
    </div>
  );
}
