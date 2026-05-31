import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_site/waitlist")({
  head: () => ({
    meta: [
      { title: "Early Access — Nexus" },
      { name: "description", content: "Join the Nexus waitlist for early access to the autonomous career OS." },
    ],
  }),
  component: WaitlistPage,
});

function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section className="relative grid min-h-[88vh] place-items-center px-6 pt-32">
      <div className="mx-auto w-full max-w-xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70"
        >
          <Sparkles className="h-3 w-3 text-cyan-300" /> Closed beta · cohort 04
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="font-display mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl"
        >
          <span className="text-gradient">Get early access.</span>
        </motion.h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] text-white/55">
          We're onboarding 200 new users per week. Drop your email — we'll send your invite within 7 days.
        </p>

        {!done ? (
          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onSubmit={(e) => { e.preventDefault(); if (email) setDone(true); }}
            className="glass mx-auto mt-8 flex max-w-md items-center gap-2 rounded-full p-1.5 pl-5"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@career.ai"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.7)] transition-transform hover:scale-[1.03]"
            >
              Join <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass mx-auto mt-8 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm text-white"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            You're on the list. We'll be in touch soon.
          </motion.div>
        )}

        <div className="mt-10 flex items-center justify-center gap-6 text-[11px] uppercase tracking-[0.18em] text-white/40">
          <span>1,200+ waitlist</span><span>·</span><span>SOC2 in progress</span><span>·</span><span>Y Combinator W26</span>
        </div>
      </div>
    </section>
  );
}