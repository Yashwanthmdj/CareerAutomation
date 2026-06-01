import { useAuth } from "@/hooks/useAuth";
import { useCareer } from "@/hooks/useCareer";
import { useResume } from "@/hooks/useResume";
import { computeWorkspaceMetrics } from "@/lib/workspace-metrics";
import { useWorkspaceContext } from "@/store/workspace";
import { useMemo } from "react";

export function useWorkspace() {
  const { user } = useAuth();
  const { profile: careerProfile } = useCareer();
  const { summary } = useResume();
  const ctx = useWorkspaceContext();

  const metrics = useMemo(
    () => computeWorkspaceMetrics(user, careerProfile, ctx.workspace, summary.resumeCount),
    [user, careerProfile, ctx.workspace, summary.resumeCount],
  );

  return {
    user,
    careerProfile,
    ...ctx,
    metrics,
  };
}
