export type IntegrationId = "whatsapp" | "linkedin" | "gmail" | "github";

export type IntegrationConnection = {
  id: IntegrationId;
  connected: boolean;
  connectedAt?: string;
};

export type ResumeState = {
  uploaded: boolean;
  fileName?: string;
  uploadedAt?: string;
};

export type ActivityEventType =
  | "profile_updated"
  | "integration_connected"
  | "integration_disconnected"
  | "resume_uploaded"
  | "career_goals_configured";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  title: string;
  subtitle: string;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  category: "system" | "integration" | "profile" | "automation";
};

export type ApplicationStage = "saved" | "applied" | "interview" | "offer";

export type Application = {
  id: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  updatedAt: string;
};

export type Opportunity = {
  id: string;
  company: string;
  role: string;
  matchScore?: number;
  status: string;
  source?: string;
};

export type UserProfile = {
  phone: string;
  location: string;
  college: string;
  degree: string;
  graduationYear: string;
  careerSummary: string;
  preferredRoles: string[];
  preferredLocations: string[];
  employmentPreferences: string;
};

export type WorkspaceState = {
  profile: UserProfile;
  integrations: IntegrationConnection[];
  resume: ResumeState;
  activity: ActivityEvent[];
  notifications: NotificationItem[];
  opportunities: Opportunity[];
  applications: Application[];
  notificationPrefs: Record<string, boolean>;
};

export type WorkspaceMetrics = {
  profileCompletion: number;
  connectedPlatforms: number;
  totalPlatforms: number;
  resumeStatus: "Missing" | "Uploaded";
  automationReadiness: number;
  hasAutomationActivity: boolean;
};
