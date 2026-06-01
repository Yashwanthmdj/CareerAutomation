import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { CURRENT_STATUS_OPTIONS } from "@/types/career";

function statusLabel(value: string | null | undefined) {
  return CURRENT_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "Not set";
}

export function WelcomeHero() {
  const { user, careerProfile, metrics } = useWorkspace();
  const name = careerProfile?.fullName?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass relative mb-4 overflow-hidden rounded-2xl p-5 sm:p-6"
    >
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/25 to-cyan-400/5 blur-3xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/55 ring-1 ring-white/10">
            <Sparkles className="h-3 w-3 text-cyan-300" />
            Mission control
          </div>
          <h2 className="font-display mt-3 text-xl font-semibold text-white sm:text-2xl">
            Welcome back, {name}
          </h2>
          <p className="mt-1.5 max-w-xl text-[13.5px] text-white/60">
            Your AI Career Operating System is ready.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/70 ring-1 ring-white/10">
              {statusLabel(careerProfile?.currentStatus)}
            </span>
            {careerProfile?.preferredRoles.slice(0, 2).map((role) => (
              <span key={role} className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-indigo-200 ring-1 ring-indigo-400/20">
                {role}
              </span>
            ))}
            {careerProfile?.preferredLocations[0] && (
              <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-cyan-200 ring-1 ring-cyan-400/20">
                {careerProfile.preferredLocations[0]}
              </span>
            )}
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Profile</div>
            <div className="font-display mt-1 text-lg font-semibold text-cyan-300">{metrics.profileCompletion}%</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Skills</div>
            <div className="font-display mt-1 text-lg font-semibold text-white">{careerProfile?.skills.length ?? 0}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">Plan</div>
            <div className="mt-1 text-[13px] font-medium capitalize text-white">{user?.plan ?? "free"}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
