import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Brain, Bot, FileSearch, Mail, MessageSquare, FileText,
  Activity, ShieldCheck, Zap, Globe, LayoutDashboard, TrendingUp,
} from "lucide-react";
import PageHero from "@/components/shared/PageHero";

export const Route = createFileRoute("/_site/features")({
  head: () => ({
    meta: [
      { title: "Features — Nexus" },
      { name: "description", content: "Eight autonomous AI agents handle your entire career workflow." },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  { icon: Brain, title: "Opportunity Brain", desc: "Continuously scans 400+ sources and ranks roles by match score." },
  { icon: Bot, title: "Autonomous Apply", desc: "Fills forms, drafts answers, and submits applications end-to-end." },
  { icon: FileSearch, title: "Resume Optimizer", desc: "Tailors your resume per role with ATS-aware rewrites." },
  { icon: Mail, title: "Outreach Engine", desc: "Composes warm, human emails to recruiters at the right moment." },
  { icon: MessageSquare, title: "Reply Triage", desc: "Reads inbound emails, classifies, and drafts replies for review." },
  { icon: FileText, title: "Form Auto-fill", desc: "Handles Workday, Greenhouse, Lever, Ashby and custom portals." },
  { icon: Activity, title: "Pipeline Tracker", desc: "Unified view of every application, stage, and follow-up." },
  { icon: ShieldCheck, title: "Human-in-the-loop", desc: "Approval gates for sensitive actions — you stay in control." },
  { icon: Zap, title: "Instant Triggers", desc: "React to new postings within 60 seconds of going live." },
  { icon: Globe, title: "Multi-region", desc: "Job sources across US, EU, UK, India and remote-first companies." },
  { icon: LayoutDashboard, title: "Mission Control", desc: "Cinematic dashboard with live agent activity feed." },
  { icon: TrendingUp, title: "Career Insights", desc: "Salary signals, market trends, and weekly intelligence digest." },
];

function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Capabilities"
        title="Every part of the hunt, automated."
        subtitle="Twelve specialized agents working in concert — so you can focus on the conversations that matter."
      />
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.04, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              className="glass glow-border group relative overflow-hidden rounded-2xl p-6 transition-shadow hover:shadow-[0_30px_80px_-30px_rgba(99,102,241,0.5)]"
            >
              <div className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-600/20 text-cyan-300 ring-1 ring-white/10">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="font-display text-[17px] font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{f.desc}</p>
              <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}