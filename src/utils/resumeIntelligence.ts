import type { AtsIntelligence } from "@/types/ats";
import type { AtsSimulatorAction, ResumeOptimization } from "@/types/resumeOptimization";

export type ImpactLevel = "High" | "Medium" | "Low";

export type RoadmapItem = {
  id: string;
  title: string;
  estimatedGain: number;
  impact: ImpactLevel;
};

export type RoleConfidence = {
  role: string;
  source: string;
  confidence: number;
};

export type ResumeReadiness = {
  internshipReady: boolean;
  fullTimeReady: boolean;
  roleReady: boolean;
  internshipLabel: string;
  fullTimeLabel: string;
  roleLabel: string;
};

export type RoleAlignment = {
  matched: number;
  total: number;
  percentage: number;
};

export function impactFromGain(gain: number): ImpactLevel {
  if (gain >= 8) return "High";
  if (gain >= 4) return "Medium";
  return "Low";
}

export function estimateAtsGainFromText(recommendation: string, index: number): number {
  const text = recommendation.toLowerCase();
  if (text.includes("skills") || text.includes("keyword")) return Math.max(3, 10 - index);
  if (text.includes("project")) return Math.max(3, 7 - index);
  if (text.includes("metric") || text.includes("quantify")) return Math.max(3, 8 - index);
  if (text.includes("headline") || text.includes("summary")) return Math.max(3, 8 - index);
  return Math.max(3, 6 - index);
}

export function roleAlignmentFromAts(ats: AtsIntelligence): RoleAlignment {
  const matched = ats.matchedSkills.length;
  const total = ats.targetSkillCount || ats.targetSkillSet.length;
  const percentage = total > 0 ? Math.round((matched / total) * 100) : 0;
  return { matched, total, percentage };
}

export function roleConfidenceFromAts(ats: AtsIntelligence): RoleConfidence {
  const role = ats.detectedRole || ats.targetRole || "Undetected";
  const source = ats.roleDetectionSource || "Not determined";
  const alignment = roleAlignmentFromAts(ats).percentage;

  let base = 55;
  const sourceLower = source.toLowerCase();
  if (sourceLower.includes("profile") || sourceLower.includes("preferred")) {
    base = 88;
  } else if (sourceLower.includes("header") || sourceLower.includes("title")) {
    base = 76;
  } else if (sourceLower.includes("skill")) {
    base = 68;
  }

  const confidence = Math.min(98, Math.max(35, Math.round(base * 0.55 + alignment * 0.45)));
  return { role, source, confidence };
}

export function resumeReadinessFromData(
  optimization: ResumeOptimization,
  ats: AtsIntelligence,
): ResumeReadiness {
  const { healthScore, sectionScores, keywordCoverage } = optimization;
  const exp = sectionScores.experience ?? 0;
  const edu = sectionScores.education ?? 0;
  const skills = sectionScores.skills ?? 0;

  const internshipReady = healthScore >= 48 && (edu >= 50 || exp >= 40 || ats.atsScore >= 45);
  const fullTimeReady = healthScore >= 68 && exp >= 60 && ats.atsScore >= 58;
  const roleReady = keywordCoverage >= 55 && skills >= 55 && ats.atsScore >= 50;

  return {
    internshipReady,
    fullTimeReady,
    roleReady,
    internshipLabel: internshipReady ? "Ready" : "Needs work",
    fullTimeLabel: fullTimeReady ? "Ready" : "Needs work",
    roleLabel: roleReady ? "Aligned" : "Building",
  };
}

export function roadmapFromOptimization(optimization: ResumeOptimization): RoadmapItem[] {
  return optimization.atsSimulator.actions.map((action, index) => ({
    id: `sim-${index}-${action.title}`,
    title: action.title,
    estimatedGain: action.estimatedGain,
    impact: impactFromGain(action.estimatedGain),
  }));
}

export function roadmapFromAts(ats: AtsIntelligence): RoadmapItem[] {
  return ats.recommendations.slice(0, 6).map((rec, index) => {
    const gain = estimateAtsGainFromText(rec, index);
    return {
      id: `ats-${index}-${rec.slice(0, 24)}`,
      title: rec,
      estimatedGain: gain,
      impact: impactFromGain(gain),
    };
  });
}

export function mergeRoadmapItems(
  primary: RoadmapItem[],
  fallback: RoadmapItem[],
  limit = 6,
): RoadmapItem[] {
  const seen = new Set<string>();
  const merged: RoadmapItem[] = [];
  for (const item of [...primary, ...fallback]) {
    const key = item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}

export function optimizationTasks(
  optimization: ResumeOptimization,
  ats: AtsIntelligence,
): RoadmapItem[] {
  const fromSimulator = roadmapFromOptimization(optimization);
  const fromImprovements = optimization.improvements.slice(0, 5).map((text, index) => {
    const gain = estimateAtsGainFromText(text, index);
    return {
      id: `imp-${index}-${text.slice(0, 24)}`,
      title: text,
      estimatedGain: gain,
      impact: impactFromGain(gain),
    };
  });
  return mergeRoadmapItems(fromSimulator, fromImprovements, 8);
}

export function groupRoadmapByImpact(items: RoadmapItem[]): Record<ImpactLevel, RoadmapItem[]> {
  return {
    High: items.filter((i) => i.impact === "High"),
    Medium: items.filter((i) => i.impact === "Medium"),
    Low: items.filter((i) => i.impact === "Low"),
  };
}

export function optimizationPotential(optimization: ResumeOptimization | null, ats: AtsIntelligence) {
  const current = optimization?.atsSimulator.currentScore ?? ats.atsScore;
  const projected = optimization?.atsSimulator.projectedScore ?? current;
  const gain = Math.max(0, projected - current);
  return { current, projected, gain };
}

export function impactStyle(impact: ImpactLevel): string {
  if (impact === "High") return "border-rose-400/30 bg-rose-400/10 text-rose-200";
  if (impact === "Medium") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
}

export function taskStorageKey(resumeId: string): string {
  return `nexus-opt-tasks:${resumeId}`;
}

export function loadCheckedTasks(resumeId: string): Set<string> {
  try {
    const raw = localStorage.getItem(taskStorageKey(resumeId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

export function saveCheckedTasks(resumeId: string, checked: Set<string>): void {
  try {
    localStorage.setItem(taskStorageKey(resumeId), JSON.stringify([...checked]));
  } catch {
    // ignore quota errors
  }
}

export function clearCheckedTasks(resumeId: string): void {
  try {
    localStorage.removeItem(taskStorageKey(resumeId));
  } catch {
    // ignore quota errors
  }
}

export function getCompletedTaskTitles(tasks: RoadmapItem[], checked: Set<string>): Set<string> {
  const titles = new Set<string>();
  for (const task of tasks) {
    if (checked.has(task.id)) {
      titles.add(task.title.toLowerCase().trim());
    }
  }
  return titles;
}

export function filterPendingRoadmapItems(
  items: RoadmapItem[],
  completedTitles: Set<string>,
): RoadmapItem[] {
  return items.filter((item) => !completedTitles.has(item.title.toLowerCase().trim()));
}

export type SimulatorPreview = {
  currentScore: number;
  projectedScore: number;
  gainDelta: number;
  completedGain: number;
  pendingGain: number;
  allActionsComplete: boolean;
  hasCompletedTasks: boolean;
};

export function simulatorPreview(
  currentScore: number,
  apiProjectedScore: number,
  pendingItems: RoadmapItem[],
  completedItems: RoadmapItem[],
): SimulatorPreview {
  const completedGain = completedItems.reduce((sum, item) => sum + item.estimatedGain, 0);
  const pendingGain = pendingItems.reduce((sum, item) => sum + item.estimatedGain, 0);
  const hasCompletedTasks = completedItems.length > 0;
  const allActionsComplete = pendingItems.length === 0 && hasCompletedTasks;

  if (allActionsComplete) {
    const estimated = Math.min(100, currentScore + completedGain);
    return {
      currentScore,
      projectedScore: estimated,
      gainDelta: Math.max(0, estimated - currentScore),
      completedGain,
      pendingGain: 0,
      allActionsComplete: true,
      hasCompletedTasks: true,
    };
  }

  const projectedScore = Math.min(100, currentScore + completedGain + pendingGain);
  return {
    currentScore,
    projectedScore: pendingItems.length > 0 ? projectedScore : apiProjectedScore,
    gainDelta: Math.max(0, projectedScore - currentScore),
    completedGain,
    pendingGain,
    allActionsComplete: false,
    hasCompletedTasks,
  };
}

export function actionToTaskId(action: AtsSimulatorAction, index: number): string {
  return `task-${index}-${action.title.slice(0, 32)}`;
}
