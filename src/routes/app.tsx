import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import AppShell from "@/components/dashboard/AppShell";
import { RequireAuth, RequireOnboarded } from "@/components/auth/AuthGuards";
import { WorkspaceGate } from "@/components/workspace/WorkspaceGate";

const APP_TITLES: Array<{ test: (pathname: string) => boolean; title: string }> = [
  { test: (pathname) => pathname === "/app" || pathname === "/app/", title: "Mission control" },
  { test: (pathname) => pathname.startsWith("/app/opportunities"), title: "Opportunities" },
  { test: (pathname) => pathname.startsWith("/app/applications"), title: "Application tracker" },
  { test: (pathname) => pathname.startsWith("/app/automation"), title: "AI Automation" },
  { test: (pathname) => pathname.startsWith("/app/resume"), title: "Resume Manager" },
  { test: (pathname) => pathname.startsWith("/app/analytics"), title: "Analytics" },
  { test: (pathname) => pathname.startsWith("/app/notifications"), title: "Notifications" },
  { test: (pathname) => pathname.startsWith("/app/integrations"), title: "Integrations" },
  { test: (pathname) => pathname.startsWith("/app/settings"), title: "Settings" },
  { test: (pathname) => pathname.startsWith("/app/profile"), title: "Profile" },
];

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const title = APP_TITLES.find((item) => item.test(normalizedPath))?.title ?? "Workspace";

  return (
    <RequireAuth>
      <RequireOnboarded>
        <WorkspaceGate>
          <AppShell title={title}>
            <Outlet />
          </AppShell>
        </WorkspaceGate>
      </RequireOnboarded>
    </RequireAuth>
  );
}

export const Route = createFileRoute("/app")({
  component: AppLayout,
});