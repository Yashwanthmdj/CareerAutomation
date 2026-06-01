import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  UserCircle,
  Plug,
  FileText,
  Bot,
  ArrowUpRight,
  Briefcase,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/AppShell";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useResume } from "@/hooks/useResume";
import { useWorkspace } from "@/hooks/useWorkspace";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — Nexus" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { metrics, workspace } = useWorkspace();
  const { activeResume } = useResume();
  const hasOpportunities = workspace.opportunities.length > 0;

  return (
    <>
      <WelcomeHero />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Profile completion"
          value={`${metrics.profileCompletion}%`}
          hint="From your profile"
          icon={UserCircle}
          accent="indigo"
        />
        <StatCard
          label="Connected platforms"
          value={`${metrics.connectedPlatforms} / ${metrics.totalPlatforms}`}
          hint="WhatsApp, LinkedIn, Gmail, GitHub"
          icon={Plug}
          accent="cyan"
        />
        <StatCard
          label="Resume"
          value={metrics.resumeStatus}
          hint={activeResume?.title ?? "Upload to continue"}
          icon={FileText}
          accent="violet"
        />
        <StatCard
          label="Automation readiness"
          value={`${metrics.automationReadiness}%`}
          hint="Workspace configuration"
          icon={Bot}
          accent="emerald"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div whileHover={{ y: -3 }} className="glass relative overflow-hidden rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Command center</div>
              <div className="font-display mt-1 text-xl font-semibold text-white">Activity overview</div>
            </div>
            <Link
              to="/app/analytics"
              className="inline-flex items-center gap-1 text-[12px] text-cyan-300 hover:text-cyan-200"
            >
              View analytics <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {metrics.hasAutomationActivity ? (
            <ChartPlaceholder message="Live analytics will render here once automation runs are recorded." />
          ) : (
            <ChartPlaceholder message="Analytics will appear once automation activity begins." />
          )}
        </motion.div>

        <ActivityFeed />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="font-display text-[15px] font-semibold text-white">Opportunities</div>
            <Link
              to="/app/opportunities"
              className="inline-flex items-center gap-1 text-[12px] text-cyan-300"
            >
              Open <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {hasOpportunities ? (
            <table className="mt-4 w-full text-sm">
              <tbody>
                {workspace.opportunities.slice(0, 4).map((o) => (
                  <tr key={o.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 text-white/90">{o.company}</td>
                    <td className="py-2.5 text-white/60">{o.role}</td>
                    <td className="py-2.5 text-right text-cyan-300 font-medium">
                      {o.matchScore != null ? `${o.matchScore}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No opportunities yet"
              description="Connect WhatsApp and LinkedIn to begin opportunity discovery."
              actionLabel="Connect platforms"
              actionTo="/app/integrations"
              className="mt-4 py-8"
            />
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="font-display text-[15px] font-semibold text-white">Automation agents</div>
          <p className="mt-1 text-[12px] text-white/50">Phase 1 — configuration status only</p>
          <div className="mt-5 space-y-4">
            {[
              "Apply Agent",
              "Email Agent",
              "Form Agent",
              "Opportunity Scout",
            ].map((name) => (
              <div key={name}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-white/70">{name}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-white/45">
                    Not configured
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-indigo-500/40 to-cyan-400/40" />
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/app/automation"
            className="mt-5 inline-flex text-[12px] text-cyan-300 hover:text-cyan-200"
          >
            Open automation registry →
          </Link>
        </div>
      </div>
    </>
  );
}
