import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Briefcase,
  Inbox,
  Bot,
  FileText,
  BarChart3,
  Bell,
  Settings,
  Sparkles,
  Search,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import BackgroundFX from "@/components/shared/BackgroundFX";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/opportunities", label: "Opportunities", icon: Briefcase },
  { to: "/app/applications", label: "Applications", icon: Inbox },
  { to: "/app/automation", label: "AI Automation", icon: Bot },
  { to: "/app/resume", label: "Resume Manager", icon: FileText },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const [collapsed, setCollapsed] = useState(false);
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "NU";

  const handleLogout = async () => {
    await logout();
    await navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-screen text-white">
      <BackgroundFX />

      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen ${
          collapsed ? "w-[72px]" : "w-[248px]"
        } transition-[width] duration-300 md:block`}
      >
        <div className="glass m-3 flex h-[calc(100vh-24px)] flex-col rounded-2xl p-3">
          <Link to="/" className="flex items-center gap-2 px-2 py-2">
            <div className="relative h-7 w-7 flex-none rounded-md bg-gradient-to-br from-indigo-400 to-violet-600 shadow-[0_0_24px_rgba(99,102,241,0.55)]">
              <div className="absolute inset-[3px] grid place-items-center rounded-[5px] bg-[#050816]/70">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              </div>
            </div>
            {!collapsed && <span className="font-display text-[15px] font-semibold text-white">Nexus</span>}
          </Link>

          <nav className="mt-4 flex flex-col gap-0.5">
            {nav.map((item) => {
              const active = item.exact
                ? normalizedPath === item.to
                : normalizedPath.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] transition-all ${
                    active
                      ? "bg-white/[0.06] text-white"
                      : "text-white/55 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="navGlow"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/15 to-cyan-400/5 ring-1 ring-inset ring-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <item.icon className={`relative h-4 w-4 flex-none ${active ? "text-cyan-300" : ""}`} />
                  {!collapsed && <span className="relative">{item.label}</span>}
                  {active && !collapsed && (
                    <span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Link
              to="/app/profile"
              className="glass flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/[0.06]"
            >
              <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold">
                {initials}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-white">{user?.name ?? "Nexus User"}</div>
                  <div className="truncate text-[11px] text-white/50">{user?.plan ?? "free"} plan</div>
                </div>
              )}
            </Link>
            {!collapsed && (
              <button
                onClick={() => void handleLogout()}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/50 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            )}
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="mt-2 w-full rounded-xl px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/40 hover:text-white"
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
          </div>
        </div>
      </aside>

      <div className={`${collapsed ? "md:pl-[80px]" : "md:pl-[256px]"} transition-[padding] duration-300`}>
        <header className="sticky top-0 z-30 px-4 pt-4 md:px-6">
          <div className="glass flex h-14 items-center gap-3 rounded-2xl px-4">
            <h1 className="font-display text-[15px] font-semibold text-white">{title}</h1>
            <div className="ml-4 hidden flex-1 items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-1.5 md:flex">
              <Search className="h-3.5 w-3.5 text-white/40" />
              <input
                placeholder="Search opportunities, candidates, automations…"
                className="w-full bg-transparent text-[13px] text-white placeholder:text-white/30 focus:outline-none"
              />
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">
                ⌘K
              </kbd>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="glass hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-white/70 sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                AI · Active
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.04] text-white/70 hover:bg-white/[0.08]">
                <Bell className="h-4 w-4" />
              </button>
              <Link
                to="/app/profile"
                className="flex items-center gap-2 rounded-full bg-white/[0.04] p-1 pr-2.5 hover:bg-white/[0.08]"
              >
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-semibold">
                  {initials}
                </div>
                <span className="max-w-[120px] truncate text-[12px] text-white/75">{user?.name ?? "Profile"}</span>
                <ChevronDown className="h-3 w-3 text-white/50" />
              </Link>
            </div>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 py-6 md:px-6 md:py-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "indigo",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: any;
  accent?: "indigo" | "cyan" | "violet" | "emerald";
}) {
  const accents: Record<string, string> = {
    indigo: "from-indigo-500/30 to-indigo-500/0 text-indigo-300",
    cyan: "from-cyan-500/30 to-cyan-500/0 text-cyan-300",
    violet: "from-violet-500/30 to-violet-500/0 text-violet-300",
    emerald: "from-emerald-500/30 to-emerald-500/0 text-emerald-300",
  };

  return (
    <motion.div whileHover={{ y: -3 }} className="glass group relative overflow-hidden rounded-2xl p-5">
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${accents[accent]} opacity-60 blur-2xl transition-opacity group-hover:opacity-100`}
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.16em] text-white/50">{label}</span>
        <Icon className={`h-4 w-4 ${accents[accent].split(" ").pop()}`} />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="font-display text-3xl font-semibold text-white">{value}</div>
        {delta && <div className="text-[11px] font-medium text-emerald-300">{delta}</div>}
      </div>
    </motion.div>
  );
}

