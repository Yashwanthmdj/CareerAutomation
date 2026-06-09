import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  UserCircle,
  Plug,
  FileText,
  Bot,
  ArrowUpRight,
  Briefcase,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/AppShell";
import { AtsIntelligencePanel } from "@/components/resume/AtsIntelligencePanel";
import { resumeService } from "@/services/resume/resumeService";
import { atsScoreColor } from "@/types/ats";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useResume } from "@/hooks/useResume";
import { useWorkspace } from "@/hooks/useWorkspace";
import { opportunityService } from "@/services/opportunity/opportunityService";
import type { Opportunity } from "@/types/opportunity";
import { formatSourceType } from "@/types/opportunity";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — Nexus" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { metrics } = useWorkspace();
  const { activeResume } = useResume();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);
  const hasOpportunities = opportunities.length > 0;
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsGrade, setAtsGrade] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setOpportunitiesLoading(true);
    opportunityService
      .list()
      .then((result) => {
        if (!cancelled) setOpportunities(result.opportunities);
      })
      .catch(() => {
        if (!cancelled) setOpportunities([]);
      })
      .finally(() => {
        if (!cancelled) setOpportunitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeResume) {
      setAtsScore(null);
      setAtsGrade("");
      return;
    }
    resumeService
      .getActiveAts()
      .then((ats) => {
        setAtsScore(ats.analysisReady ? ats.atsScore : null);
        setAtsGrade(ats.grade);
      })
      .catch(() => {
        setAtsScore(null);
        setAtsGrade("");
      });
  }, [activeResume?.id]);

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
          label="ATS score"
          value={atsScore != null ? `${atsScore}` : metrics.resumeStatus}
          hint={
            atsScore != null
              ? `${atsGrade || "Scored"} · ${activeResume?.title ?? "Active resume"}`
              : activeResume?.title ?? "Upload resume to score"
          }
          icon={atsScore != null ? Target : FileText}
          accent="violet"
          valueClassName={atsScore != null ? atsScoreColor(atsScore) : undefined}
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

      {activeResume && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mt-6 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Phase 3.3</div>
              <div className="font-display mt-1 text-lg font-semibold text-white">ATS Intelligence</div>
            </div>
            <Link
              to="/app/resume"
              className="inline-flex items-center gap-1 text-[12px] text-cyan-300 hover:text-cyan-200"
            >
              Resume Manager <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4">
            <AtsIntelligencePanel useActive compact />
          </div>
        </motion.div>
      )}

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
          {opportunitiesLoading ? (
            <p className="mt-4 text-[12px] text-white/45">Loading opportunities…</p>
          ) : hasOpportunities ? (
            <table className="mt-4 w-full text-sm">
              <tbody>
                {opportunities.slice(0, 4).map((o) => (
                  <tr key={o.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 text-white/90">{o.company}</td>
                    <td className="py-2.5 text-white/60">{o.title}</td>
                    <td className="py-2.5 text-right text-cyan-300 font-medium">
                      {formatSourceType(o.sourceType)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No opportunities yet"
              description="Add opportunities manually or ingest from connected platforms in future phases."
              actionLabel="Open opportunities"
              actionTo="/app/opportunities"
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
