import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import PageHero from "@/components/shared/PageHero";

export const Route = createFileRoute("/_site/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Nexus" },
      { name: "description", content: "Simple, transparent pricing for autonomous career acceleration." },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Starter",
    icon: Sparkles,
    price: "$0",
    cadence: "forever",
    desc: "For exploring the platform.",
    features: ["25 tracked opportunities", "5 AI-assisted applications / mo", "1 resume profile", "Community support"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    icon: Zap,
    price: "$29",
    cadence: "/ month",
    desc: "For active job seekers.",
    features: ["Unlimited opportunities", "150 autonomous applications / mo", "5 resume variants", "Email + LinkedIn outreach", "Priority support"],
    cta: "Start 14-day trial",
    highlight: true,
  },
  {
    name: "Autonomous AI",
    icon: Crown,
    price: "$79",
    cadence: "/ month",
    desc: "Full autopilot — hands-off.",
    features: ["Unlimited applications", "24/7 monitoring & instant triggers", "Recruiter outreach engine", "Multi-region sourcing", "Dedicated success manager"],
    cta: "Go autonomous",
    highlight: false,
  },
];

function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Pay for outcomes, not seats."
        subtitle="Every plan includes the full agent stack. Scale automation volume as your search heats up."
      />
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              className={`glass relative rounded-3xl p-7 transition-all ${
                p.highlight
                  ? "glow-border ring-1 ring-indigo-400/30 shadow-[0_40px_120px_-30px_rgba(99,102,241,0.55)]"
                  : "border border-white/5"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow-[0_8px_30px_-5px_rgba(99,102,241,0.7)]">
                  Recommended
                </div>
              )}
              <div className="flex items-center gap-2 text-white/70">
                <p.icon className="h-4 w-4 text-cyan-300" />
                <span className="font-display text-sm font-semibold uppercase tracking-[0.16em]">{p.name}</span>
              </div>
              <div className="mt-6 flex items-end gap-1">
                <span className="font-display text-5xl font-semibold text-white">{p.price}</span>
                <span className="mb-1.5 text-sm text-white/40">{p.cadence}</span>
              </div>
              <p className="mt-2 text-sm text-white/55">{p.desc}</p>
              <Link
                to="/signup"
                className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] ${
                  p.highlight
                    ? "bg-gradient-to-b from-indigo-500 to-violet-600 text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.7)]"
                    : "bg-white/[0.04] text-white border border-white/10 hover:bg-white/[0.08]"
                }`}
              >
                {p.cta}
              </Link>
              <ul className="mt-7 space-y-3 border-t border-white/5 pt-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-white/70">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-cyan-300" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="glass mt-14 rounded-3xl p-8 text-center">
          <h3 className="font-display text-2xl font-semibold text-white">Enterprise & Career Services</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/55">
            University career centers, bootcamps, and outplacement firms — deploy Nexus across your cohorts with custom pricing.
          </p>
          <Link
            to="/help"
            className="mt-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-white hover:bg-white/[0.08]"
          >
            Talk to sales
          </Link>
        </div>
      </section>
    </>
  );
}