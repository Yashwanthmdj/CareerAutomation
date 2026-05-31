import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { ChevronDown, MessageSquare, BookOpen, LifeBuoy, Send } from "lucide-react";
import PageHero from "@/components/shared/PageHero";

export const Route = createFileRoute("/_site/help")({
  head: () => ({
    meta: [
      { title: "Help & Support — Nexus" },
      { name: "description", content: "Docs, FAQ, and human support for Nexus." },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  { q: "How autonomous is the apply engine?", a: "Fully autonomous by default, with optional human-in-the-loop approval gates on sensitive actions like cover letter sends and salary inputs." },
  { q: "Will recruiters know AI applied for me?", a: "No. Nexus mimics natural form-filling cadence, uses your writing voice, and never inserts watermarks or telltale phrasing." },
  { q: "What job boards do you support?", a: "LinkedIn, Indeed, Wellfound, Greenhouse, Lever, Ashby, Workday, SmartRecruiters, Workable, plus 200+ company career pages." },
  { q: "Is my data private?", a: "Yes. All resumes and credentials are encrypted at rest with per-user keys. Nexus is SOC 2 Type II in progress." },
  { q: "Can I cancel anytime?", a: "Yes — month-to-month, no contracts. Your data exports as JSON on cancellation." },
  { q: "Does it work outside the US?", a: "Yes. We index roles across US, EU, UK, Canada, India, and remote-first companies globally." },
];

function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="We're here when you need us."
        subtitle="Search the docs, browse common questions, or talk to a real human."
      />

      <section className="mx-auto max-w-5xl px-6 pb-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: BookOpen, t: "Documentation", d: "Setup guides, recipes, API reference." },
            { icon: MessageSquare, t: "Live chat", d: "Avg response 4 min during business hours." },
            { icon: LifeBuoy, t: "Email support", d: "help@nexus.ai — 24h response on Pro." },
          ].map((c, i) => (
            <motion.div
              key={c.t}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="glass group rounded-2xl p-5 transition-all hover:shadow-[0_20px_60px_-20px_rgba(99,102,241,0.45)]"
            >
              <Link to="/waitlist" className="block">
                <c.icon className="h-5 w-5 text-cyan-300" />
                <div className="mt-3 font-display text-base font-semibold text-white">{c.t}</div>
                <div className="mt-1 text-sm text-white/55">{c.d}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="font-display mb-5 text-2xl font-semibold text-white">Frequently asked</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => <FaqItem key={i} {...f} />)}
        </div>

        <div className="glass mt-12 rounded-3xl p-7">
          <div className="flex items-center gap-2 text-white">
            <Send className="h-4 w-4 text-cyan-300" />
            <span className="font-display font-semibold">Send us a message</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400/50 focus:outline-none" placeholder="Name" />
            <input className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400/50 focus:outline-none" placeholder="Email" />
          </div>
          <textarea rows={4} className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400/50 focus:outline-none" placeholder="How can we help?" />
          <button className="mt-4 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 px-5 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.7)] hover:scale-[1.02] transition-transform">
            Send message
          </button>
        </div>
      </section>
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-[14.5px] font-medium text-white">{q}</span>
        <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-[13.5px] leading-relaxed text-white/60">{a}</p>
      </motion.div>
    </div>
  );
}