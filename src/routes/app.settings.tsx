import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import {
  Settings as SettingsIcon,
  Shield,
  Bell as BellIcon,
  Plug,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — Nexus" }] }),
  component: Settings,
});

const tabs = [
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: BellIcon },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "preferences", label: "Preferences", icon: SettingsIcon },
];

function Settings() {
  const [active, setActive] = useState("account");
  const { user } = useAuth();
  const { workspace, metrics, careerProfile } = useWorkspace();

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="glass h-fit rounded-2xl p-2">
          {tabs.map((t) => {
            const on = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors ${on ? "text-white" : "text-white/55 hover:text-white"}`}
              >
                {on && (
                  <motion.span
                    layoutId="setTab"
                    className="absolute inset-0 rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/10"
                  />
                )}
                <t.icon className="relative h-4 w-4" />
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {active === "account" && (
            <Section title="Account">
              <Field label="Full name" value={user?.name ?? "—"} />
              <Field label="Email" value={user?.email ?? "—"} />
              <Field label="Plan" value={`${user?.plan ?? "free"} plan`} />
              <Link
                to="/app/profile"
                className="inline-flex text-[12px] text-cyan-300 hover:text-cyan-200"
              >
                Edit full profile →
              </Link>
            </Section>
          )}

          {active === "security" && (
            <Section title="Security">
              <Field label="Authentication" value="JWT session (active)" />
              <Field label="Password" value="Managed via login credentials" />
              <p className="text-[12px] text-white/50">
                Password change and two-factor authentication will be available in a future release.
              </p>
            </Section>
          )}

          {active === "notifications" && (
            <Section title="Notifications">
              <p className="text-[13px] text-white/55">
                Configure delivery preferences on the{" "}
                <Link to="/app/notifications" className="text-cyan-300 hover:text-cyan-200">
                  notifications page
                </Link>
                .
              </p>
              {Object.entries(workspace.notificationPrefs).map(([key, on]) => (
                <Field key={key} label={key} value={on ? "Enabled" : "Disabled"} />
              ))}
            </Section>
          )}

          {active === "integrations" && (
            <Section title="Integrations">
              <Field
                label="Connected platforms"
                value={`${metrics.connectedPlatforms} / ${metrics.totalPlatforms}`}
              />
              <Link
                to="/app/integrations"
                className="inline-flex text-[12px] text-cyan-300 hover:text-cyan-200"
              >
                Manage integrations →
              </Link>
            </Section>
          )}

          {active === "preferences" && (
            <Section title="Preferences">
              <Field
                label="Employment type"
                value={careerProfile?.employmentType?.replace("_", " ") ?? "Not set"}
              />
              <Field
                label="Preferred roles"
                value={careerProfile?.preferredRoles.join(", ") || "Not set"}
              />
              <Field
                label="Preferred locations"
                value={careerProfile?.preferredLocations.join(", ") || "Not set"}
              />
              <Link
                to="/app/profile"
                className="inline-flex text-[12px] text-cyan-300 hover:text-cyan-200"
              >
                Update career preferences →
              </Link>
            </Section>
          )}
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
