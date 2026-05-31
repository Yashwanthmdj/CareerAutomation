import { Link, useNavigate } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Sparkles, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/integrations", label: "Integrations" },
  { to: "/app", label: "Dashboard" },
  { to: "/help", label: "Help" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isInitializing, logout } = useAuth();
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], [0.2, 0.85]);
  const [open, setOpen] = useState(false);
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
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 left-1/2 z-50 w-[min(1180px,calc(100%-2rem))] -translate-x-1/2"
    >
      <motion.div
        style={{ opacity: bg }}
        className="absolute inset-0 -z-10 rounded-full bg-[#050816]/70 backdrop-blur-2xl"
      />
      <div className="glass relative flex items-center justify-between rounded-full px-5 py-2.5">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-indigo-400 to-violet-600 shadow-[0_0_24px_rgba(99,102,241,0.55)] transition-transform group-hover:scale-105">
            <div className="absolute inset-[3px] rounded-[5px] bg-[#050816]/70 grid place-items-center">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            </div>
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight text-white">
            Nexus
          </span>
        </Link>

        <nav className="hidden gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="group relative text-[13px] text-white/60 transition-colors hover:text-white"
              activeProps={{ className: "!text-white" }}
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-indigo-400 to-cyan-300 transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isInitializing ? (
            <div className="hidden sm:flex">
              <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
            </div>
          ) : !isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="hidden text-[13px] text-white/70 transition-colors hover:text-white sm:inline"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 px-4 py-2 text-[13px] font-medium text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:scale-[1.03]"
              >
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/app" className="text-[13px] text-white/80 transition-colors hover:text-white">
                Dashboard
              </Link>
              <Link to="/app/profile" className="flex items-center gap-2 rounded-full bg-white/[0.04] p-1 pr-2.5 hover:bg-white/[0.08]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-semibold text-white">
                  {initials}
                </span>
                <span className="max-w-[110px] truncate text-[12px] text-white/80">{user?.name}</span>
              </Link>
              <button
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/70 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden ml-1 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mt-2 flex flex-col gap-1 rounded-2xl p-3 md:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}
          {isInitializing ? (
            <div className="rounded-lg px-3 py-2 text-sm text-white/50">Checking session...</div>
          ) : !isAuthenticated ? (
            <>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/app/profile"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  void handleLogout();
                  setOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
              >
                Logout
              </button>
            </>
          )}
        </motion.div>
      )}
    </motion.header>
  );
}