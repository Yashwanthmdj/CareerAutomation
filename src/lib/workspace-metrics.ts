import { PLATFORM_IDS } from "@/constants/integrations";
import type { CareerProfile } from "@/types/career";
import type { User } from "@/types/user";
import type { WorkspaceMetrics, WorkspaceState } from "@/types/workspace";

export function computeWorkspaceMetrics(
  user: User | null,
  career: CareerProfile | null,
  workspace: WorkspaceState,
  resumeCount = 0,
): WorkspaceMetrics {
  const connectedPlatforms = workspace.integrations.filter((i) => i.connected).length;
  const totalPlatforms = PLATFORM_IDS.length;
  const profileCompletion = career?.profileCompletion ?? 0;
  const hasResume = resumeCount > 0;
  const hasCareerGoals =
    (career?.preferredRoles.length ?? 0) > 0 && (career?.preferredLocations.length ?? 0) > 0;

  const readinessParts = [
    profileCompletion / 100,
    connectedPlatforms / totalPlatforms,
    hasResume ? 1 : 0,
    hasCareerGoals ? 1 : 0,
  ];
  const automationReadiness = Math.round(
    (readinessParts.reduce((a, b) => a + b, 0) / readinessParts.length) * 100,
  );

  const hasAutomationActivity =
    workspace.applications.length > 0 || workspace.opportunities.length > 0;

  return {
    profileCompletion,
    connectedPlatforms,
    totalPlatforms,
    resumeStatus: hasResume ? (resumeCount === 1 ? "1 resume" : `${resumeCount} resumes`) : "Missing",
    automationReadiness,
    hasAutomationActivity,
  };
}
