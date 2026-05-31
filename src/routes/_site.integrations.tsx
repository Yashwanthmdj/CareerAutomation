import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  MessageCircle, Mail, Linkedin, FileText, Send, FileSearch,
  Calendar, Slack, Chrome, Database, Webhook, Zap,
} from "lucide-react";
import PageHero from "@/components/shared/PageHero";

export const Route = createFileRoute("/_site/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Nexus" },
      { name: "description", content: "Connect your stack. Nexus plugs into the tools you already use." },
    ],
  }),
  component: IntegrationsPage,
});

const integrations = [
  { icon: MessageCircle, name: "WhatsApp", desc: "Get alerts and approve actions from your phone." },
  { icon: Mail, name: "Gmail", desc: "Two-way email — reads, classifies, drafts replies." },
  { icon: Linkedin, name: "LinkedIn", desc: "Easy Apply + InMail automation, recruiter discovery." },
  { icon: FileText, name: "Google Forms", desc: "Fills any web form including portal questionnaires." },
  { icon: Send, name: "Telegram", desc: "Lightweight notifications and quick commands." },
  { icon: FileSearch, name: "Resume Parser", desc: "Imports and structures PDFs, DOCX, LaTeX." },
  { icon: Calendar, name: "Google Calendar", desc: "Auto-schedules interviews and prep blocks." },
  { icon: Slack, name: "Slack", desc: "Daily digests and instant high-match alerts." },
  { icon: Chrome, name: "Chrome Extension", desc: "One-click apply from any job page." },
  { icon: Database, name: "Notion", desc: "Syncs pipeline and notes into your workspace." },
  { icon: Webhook, name: "Webhooks", desc: "Pipe events into Zapier, n8n, or your own stack." },
  { icon: Zap, name: "API", desc: "Full programmatic access for power users." },
];

function IntegrationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Integrations"
        title="Wired into your workflow."
        subtitle="One agent network, every channel. Native connectors and an open API."
      />
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((it, i) => (
            <motion.div
              key={it.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.03, duration: 0.6 }}
              whileHover={{ y: -4, rotateX: 3 }}
              style={{ transformStyle: "preserve-3d" }}
              className="glass group relative overflow-hidden rounded-2xl p-5 transition-all hover:shadow-[0_30px_80px_-30px_rgba(99,102,241,0.5)]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] ring-1 ring-white/10">
                  <it.icon className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <div className="font-display text-[15px] font-semibold text-white">{it.name}</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-300/70">Connected</div>
                </div>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-white/55">{it.desc}</p>
              <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}