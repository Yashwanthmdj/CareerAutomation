import { PLATFORM_IDS } from "@/constants/integrations";
import type { WorkspaceState } from "@/types/workspace";

export function createDefaultWorkspace(): WorkspaceState {
  return {
    profile: {
      phone: "",
      location: "",
      college: "",
      degree: "",
      graduationYear: "",
      careerSummary: "",
      preferredRoles: [],
      preferredLocations: [],
      employmentPreferences: "",
    },
    integrations: PLATFORM_IDS.map((id) => ({ id, connected: false })),
    resume: { uploaded: false },
    activity: [],
    notifications: [],
    opportunities: [],
    applications: [],
    notificationPrefs: {
      highMatchOpportunities: true,
      recruiterReplies: true,
      interviewReminders: true,
      dailyDigestEmail: false,
      slackNotifications: false,
      weeklyPerformanceReport: false,
    },
  };
}
