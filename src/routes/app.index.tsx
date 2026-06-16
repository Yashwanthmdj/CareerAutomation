import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  UserCircle,
  Plug,
  FileText,
  Bot,
  ArrowUpRight,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/AppShell";
import { AtsIntelligencePanel } from "@/components/resume/AtsIntelligencePanel";
import { resumeService } from "@/services/resume/resumeService";
import { atsScoreColor } from "@/types/ats";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { useResume } from "@/hooks/useResume";
import { useWorkspace } from "@/hooks/useWorkspace";
import { OpportunityDiscoveryCarousel } from "@/components/dashboard/OpportunityDiscoveryCarousel";
import { OpportunityDiscoveryMetrics } from "@/components/dashboard/OpportunityDiscoveryMetrics";
import { ConnectedSourcesPanel } from "@/components/dashboard/ConnectedSourcesPanel";
import { ApplicationPipelinePanel } from "@/components/dashboard/ApplicationPipelinePanel";
import { AutomationRegistryPanel } from "@/components/dashboard/AutomationRegistryPanel";
import { RecommendedOpportunitiesCarousel } from "@/components/dashboard/RecommendedOpportunitiesCarousel";
import { opportunityService } from "@/services/opportunity/opportunityService";
import type { OpportunityRecommendation } from "@/types/opportunityMatch";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — Nexus" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { metrics } = useWorkspace();
  const { activeResume } = useResume();
  const [recommendations, setRecommendations] = useState<OpportunityRecommendation[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);
  const [recommendationsMessage, setRecommendationsMessage] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsGrade, setAtsGrade] = useState<string>("");

  const loadRecommendations = useCallback(async () => {
    setOpportunitiesLoading(true);
    try {
      const result = await opportunityService.getRecommended({ limit: 5 });
      setRecommendations(result.recommendations);
      setRecommendationsMessage(result.message ?? null);
    } catch {
      setRecommendations([]);
      setRecommendationsMessage(null);
    } finally {
      setOpportunitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

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

      <div className="mt-6">
        <ApplicationPipelinePanel />
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

      <div className="mt-6">
        <OpportunityDiscoveryMetrics />
      </div>

      <div className="mt-6">
        <ConnectedSourcesPanel />
      </div>

      <div className="mt-6">
        <OpportunityDiscoveryCarousel onRunComplete={() => void loadRecommendations()} />
      </div>

      <div className="mt-6">
        <RecommendedOpportunitiesCarousel
          recommendations={recommendations}
          loading={opportunitiesLoading}
          message={recommendationsMessage}
        />
      </div>

      <div className="mt-6">
        <AutomationRegistryPanel />
      </div>
    </>
  );
}
