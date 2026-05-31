import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { MapPin, Briefcase, GraduationCap, Sparkles, Edit3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile — Nexus" }] }),
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "NU";

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
        <motion.div whileHover={{ y: -3 }} className="glass relative overflow-hidden rounded-2xl p-6">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/30 to-cyan-400/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-2xl font-semibold text-white shadow-[0_0_30px_rgba(99,102,241,0.5)]">
              {initials}
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-white">{user?.name ?? "Nexus User"}</div>
              <div className="mt-0.5 text-[13px] text-white/55">{user?.email ?? "user@nexus.ai"}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-white/50">
                <MapPin className="h-3 w-3" /> San Francisco, CA
              </div>
            </div>
          </div>

          <button className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12.5px] text-white hover:bg-white/[0.08]">
            <Edit3 className="h-3 w-3" /> Edit profile
          </button>

          <div className="relative mt-5 space-y-3">
            {[
              ["Plan", `${user?.plan ?? "free"} plan`],
              ["Member since", "March 2024"],
              ["Applications sent", "284"],
              ["Interview conversion", "14.1%"],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                <span className="text-[12px] text-white/50">{l}</span>
                <span className="text-[12.5px] font-medium text-white">{v}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span className="font-display text-[15px] font-semibold text-white">Career profile</span>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">
              Product leader with 8+ years shipping AI-native and developer products at Stripe, Notion, and Vercel. Operates across 0→1 discovery, growth experimentation, and platform pricing.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Product Strategy", "AI/ML", "0→1", "Growth", "Platform", "Pricing", "Developer Tools"].map((t) => (
                <span key={t} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/70 ring-1 ring-white/10">{t}</span>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-cyan-300" />
              <span className="font-display text-[15px] font-semibold text-white">Experience</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Stripe", "Senior Product Manager", "2022 — Present"],
                ["Notion", "PM, AI", "2020 — 2022"],
                ["Vercel", "Associate PM", "2018 — 2020"],
              ].map(([c, r, t]) => (
                <motion.div key={c} whileHover={{ x: 3 }} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                  <div>
                    <div className="text-[13.5px] font-medium text-white">{r}</div>
                    <div className="mt-0.5 text-[12px] text-white/55">{c}</div>
                  </div>
                  <span className="text-[11.5px] text-white/40">{t}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-cyan-300" />
              <span className="font-display text-[15px] font-semibold text-white">Education</span>
            </div>
            <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
              <div className="text-[13.5px] font-medium text-white">Stanford University</div>
              <div className="mt-0.5 text-[12px] text-white/55">B.S. Computer Science · 2014 — 2018</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}