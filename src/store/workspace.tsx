import { createDefaultWorkspace } from "@/lib/workspace-defaults";
import { computeWorkspaceMetrics } from "@/lib/workspace-metrics";
import type { User } from "@/types/user";
import type {
  ActivityEvent,
  ActivityEventType,
  IntegrationId,
  UserProfile,
  WorkspaceMetrics,
  WorkspaceState,
} from "@/types/workspace";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_PREFIX = "nexus_workspace_";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadWorkspace(userId: string): WorkspaceState {
  if (typeof window === "undefined") return createDefaultWorkspace();
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return createDefaultWorkspace();
    const parsed = JSON.parse(raw) as WorkspaceState;
    return { ...createDefaultWorkspace(), ...parsed };
  } catch {
    return createDefaultWorkspace();
  }
}

function saveWorkspace(userId: string, state: WorkspaceState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

function createEventId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const ACTIVITY_COPY: Record<
  ActivityEventType,
  (detail?: string) => { title: string; subtitle: string }
> = {
  profile_updated: () => ({
    title: "Profile updated",
    subtitle: "Your career profile was saved.",
  }),
  integration_connected: (detail) => ({
    title: `${detail ?? "Platform"} connected`,
    subtitle: "Integration is ready for future automation phases.",
  }),
  integration_disconnected: (detail) => ({
    title: `${detail ?? "Platform"} disconnected`,
    subtitle: "Connection removed from your workspace.",
  }),
  resume_uploaded: (detail) => ({
    title: "Resume uploaded",
    subtitle: detail ? `File: ${detail}` : "Your resume is stored in Nexus.",
  }),
  career_goals_configured: () => ({
    title: "Career goals configured",
    subtitle: "Preferred roles and locations were saved.",
  }),
};

type WorkspaceContextValue = {
  workspace: WorkspaceState;
  metrics: WorkspaceMetrics;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setIntegrationConnected: (id: IntegrationId, connected: boolean) => void;
  notifyResumeUploaded: (fileName: string) => void;
  setNotificationPref: (key: string, value: boolean) => void;
  markAllNotificationsRead: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  user,
  children,
}: {
  user: User | null;
  children: ReactNode;
}) {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() =>
    user ? loadWorkspace(user.id) : createDefaultWorkspace(),
  );

  useEffect(() => {
    if (!user) {
      setWorkspace(createDefaultWorkspace());
      return;
    }
    setWorkspace(loadWorkspace(user.id));
  }, [user?.id]);

  const persist = useCallback(
    (next: WorkspaceState) => {
      setWorkspace(next);
      if (user) saveWorkspace(user.id, next);
    },
    [user],
  );

  const pushActivity = useCallback(
    (type: ActivityEventType, detail?: string) => {
      const copy = ACTIVITY_COPY[type](detail);
      const event: ActivityEvent = {
        id: createEventId(),
        type,
        title: copy.title,
        subtitle: copy.subtitle,
        createdAt: new Date().toISOString(),
      };
      return event;
    },
    [],
  );

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setWorkspace((prev) => {
        const hadGoals =
          prev.profile.preferredRoles.length > 0 && prev.profile.preferredLocations.length > 0;
        const nextProfile = { ...prev.profile, ...patch };
        const hasGoals =
          nextProfile.preferredRoles.length > 0 && nextProfile.preferredLocations.length > 0;

        const events = [...prev.activity];
        events.unshift(pushActivity("profile_updated"));
        if (!hadGoals && hasGoals) {
          events.unshift(pushActivity("career_goals_configured"));
        }

        const next = { ...prev, profile: nextProfile, activity: events.slice(0, 50) };
        if (user) saveWorkspace(user.id, next);
        return next;
      });
    },
    [pushActivity, user],
  );

  const setIntegrationConnected = useCallback(
    (id: IntegrationId, connected: boolean) => {
      const platformName =
        id === "whatsapp"
          ? "WhatsApp"
          : id === "linkedin"
            ? "LinkedIn"
            : id === "gmail"
              ? "Gmail"
              : "GitHub";

      setWorkspace((prev) => {
        const integrations = prev.integrations.map((item) =>
          item.id === id
            ? {
                ...item,
                connected,
                connectedAt: connected ? new Date().toISOString() : undefined,
              }
            : item,
        );
        const events = [
          pushActivity(
            connected ? "integration_connected" : "integration_disconnected",
            platformName,
          ),
          ...prev.activity,
        ];
        const next = { ...prev, integrations, activity: events.slice(0, 50) };
        if (user) saveWorkspace(user.id, next);
        return next;
      });
    },
    [pushActivity, user],
  );

  const notifyResumeUploaded = useCallback(
    (fileName: string) => {
      setWorkspace((prev) => {
        const events = [pushActivity("resume_uploaded", fileName), ...prev.activity];
        const next = { ...prev, activity: events.slice(0, 50) };
        if (user) saveWorkspace(user.id, next);
        return next;
      });
    },
    [pushActivity, user],
  );

  const setNotificationPref = useCallback(
    (key: string, value: boolean) => {
      setWorkspace((prev) => {
        const next = {
          ...prev,
          notificationPrefs: { ...prev.notificationPrefs, [key]: value },
        };
        if (user) saveWorkspace(user.id, next);
        return next;
      });
    },
    [user],
  );

  const markAllNotificationsRead = useCallback(() => {
    setWorkspace((prev) => {
      const next = {
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      };
      if (user) saveWorkspace(user.id, next);
      return next;
    });
  }, [user]);

  const metrics = useMemo(
    () => computeWorkspaceMetrics(user, null, workspace),
    [user, workspace],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace,
      metrics,
      updateProfile,
      setIntegrationConnected,
      notifyResumeUploaded,
      setNotificationPref,
      markAllNotificationsRead,
    }),
    [
      workspace,
      metrics,
      updateProfile,
      setIntegrationConnected,
      notifyResumeUploaded,
      setNotificationPref,
      markAllNotificationsRead,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used within WorkspaceProvider");
  return ctx;
}
