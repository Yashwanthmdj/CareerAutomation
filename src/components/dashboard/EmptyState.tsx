import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center ${className}`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-400/10 ring-1 ring-white/10">
        <Icon className="h-5 w-5 text-cyan-300" />
      </div>
      <div className="mt-4 font-display text-[15px] font-semibold text-white">{title}</div>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/55">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 px-4 py-2 text-[12.5px] font-medium text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.6)]"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 px-4 py-2 text-[12.5px] font-medium text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.6)]"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
