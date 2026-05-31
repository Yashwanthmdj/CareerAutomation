import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Settings as SettingsIcon, KeyRound, CreditCard, Plug, Shield, Bell as BellIcon } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — Nexus" }] }),
  component: Settings,
});

const tabs = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "automation", label: "Automation rules", icon: Plug },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "api", label: "API keys", icon: KeyRound },
  { id: "notifs", label: "Notifications", icon: BellIcon },
];

function Settings() {
  const [active, setActive] = useState("general");

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="glass h-fit rounded-2xl p-2">
          {tabs.map((t) => {
            const on = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors ${on ? "text-white" : "text-white/55 hover:text-white"}`}
              >
                {on && <motion.span layoutId="setTab" className="absolute inset-0 rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/10" />}
                <t.icon className="relative h-4 w-4" />
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <Section title="Workspace">
            <Field label="Workspace name" value="Nexus · Personal" />
            <Field label="Primary email" value="alex@nexus.ai" />
            <Field label="Time zone" value="America/Los_Angeles" />
          </Section>

          <Section title="Automation rules">
            <div className="space-y-3">
              {[
                ["Auto-apply when match ≥ 90%", true],
                ["Skip companies on blocklist", true],
                ["Pause overnight (10pm–7am PT)", false],
                ["Require approval for FAANG roles", true],
              ].map(([l, on]) => (
                <div key={l as string} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <span className="text-[13px] text-white/85">{l}</span>
                  <div className={`relative h-5 w-9 rounded-full ${on ? "bg-cyan-400/80" : "bg-white/10"}`}>
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="API keys">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-white">Production key</div>
                  <div className="mt-1 font-mono text-[12px] text-white/55">nxs_live_••••••••••••••5f2a</div>
                </div>
                <button className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white">Rotate</button>
              </div>
            </div>
          </Section>

          <Section title="Danger zone">
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/[0.04] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-white">Delete workspace</div>
                  <div className="mt-1 text-[12px] text-white/55">This permanently removes all data and automations.</div>
                </div>
                <button className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-[12px] text-rose-200">Delete</button>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="font-display text-[14px] font-semibold text-white">{title}</div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className="mt-1 text-[13.5px] text-white">{value}</div>
    </div>
  );
}