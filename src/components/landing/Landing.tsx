import { useEffect, useRef } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform, useReducedMotion } from "motion/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  Sparkles,
  Play,
  MessageSquare,
  Brain,
  FileText,
  Mail,
  FileSearch,
  LayoutDashboard,
  Activity,
  Bot,
  CheckCircle2,
  Zap,
  Globe,
  ShieldCheck,
  CircleDot,
  TrendingUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function useCursorGlow() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);
  return { x, y };
}

/* ------------------------------------------------------------------ */
/*  Tilt card                                                         */
/* ------------------------------------------------------------------ */

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { stiffness: 150, damping: 18 });
  const ry = useSpring(0, { stiffness: 150, damping: 18 });
  const reduced = useReducedMotion();

  const onMove = (e: React.PointerEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 10);
    rx.set(-py * 10);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Magnetic button                                                   */
/* ------------------------------------------------------------------ */

function MagneticButton({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });

  const onMove = (e: React.PointerEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.25);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors will-change-transform";
  const styles =
    variant === "primary"
      ? "text-white bg-gradient-to-b from-indigo-500 to-violet-600 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-indigo-400 hover:to-violet-500"
      : "text-white/90 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08]";

  return (
    <motion.button
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x, y }}
      className={`${base} ${styles} ${className}`}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Reveal                                                            */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Background                                                        */
/* ------------------------------------------------------------------ */

function BackgroundFX() {
  const { x, y } = useCursorGlow();
  const tx = useTransform(x, (v) => v - 300);
  const ty = useTransform(y, (v) => v - 300);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#050816]" />
      {/* gradient blobs */}
      <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-indigo-600/25 blur-[140px] animate-pulse-glow" />
      <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[160px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      <div className="absolute bottom-0 left-1/3 h-[460px] w-[460px] rounded-full bg-cyan-500/15 blur-[150px] animate-pulse-glow" style={{ animationDelay: "3s" }} />
      {/* grid */}
      <div className="absolute inset-0 grid-bg opacity-70" />
      {/* noise */}
      <div className="absolute inset-0 noise" />
      {/* cursor glow */}
      <motion.div
        style={{ x: tx, y: ty }}
        className="absolute h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_60%)]"
      />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_50%,#050816_100%)]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav                                                               */
/* ------------------------------------------------------------------ */

function Nav() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing, user, logout } = useAuth();
  const navLinks = [
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/integrations", label: "Integrations" },
    { to: "/help", label: "Help" },
  ];
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
      className="fixed top-4 left-1/2 z-50 w-[min(1100px,calc(100%-2rem))] -translate-x-1/2"
    >
      <div className="glass relative flex items-center justify-between rounded-full px-5 py-2.5">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-indigo-400 to-violet-600 shadow-[0_0_24px_rgba(99,102,241,0.55)]">
            <div className="absolute inset-[3px] rounded-[5px] bg-[#050816]/70 grid place-items-center">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            </div>
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight text-white">Nexus</span>
        </Link>
        <nav className="hidden gap-8 md:flex">
          {navLinks.map((item) => (
            <Link key={item.to} to={item.to} className="text-[13px] text-white/60 transition-colors hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isInitializing ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
          ) : isAuthenticated ? (
            <>
              <Link to="/app" className="hidden text-[13px] text-white/70 transition-colors hover:text-white sm:inline">
                Dashboard
              </Link>
              <Link to="/app/profile" className="hidden items-center gap-2 rounded-full bg-white/[0.05] px-2 py-1 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-semibold text-white">
                  {initials}
                </span>
                <span className="max-w-[100px] truncate text-[12px] text-white/80">{user?.name}</span>
              </Link>
              <button
                onClick={() => void handleLogout()}
                className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/70 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden text-[13px] text-white/70 transition-colors hover:text-white sm:inline">
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600 px-4 py-2 text-[13px] font-medium text-white shadow-[0_10px_40px_-10px_rgba(99,102,241,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] transition-colors hover:from-indigo-400 hover:to-violet-500"
              >
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                              */
/* ------------------------------------------------------------------ */

function Hero({ isAuthenticated, userName }: { isAuthenticated: boolean; userName?: string }) {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);
  const heroFade = useTransform(scrollY, [0, 500], [1, 0.4]);

  return (
    <section className="relative pt-40 pb-24 sm:pt-48 sm:pb-32">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <Link
            to="/waitlist"
            className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] text-white/70"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
            Now in private beta · v0.9
            <ArrowRight className="h-3 w-3 opacity-60" />
          </Link>
        </Reveal>

        <motion.h1
          style={{ y: heroY, opacity: heroFade }}
          className="font-display mt-8 text-[44px] leading-[1.02] font-semibold tracking-tight text-white sm:text-[72px] md:text-[88px]"
        >
          <Reveal>
            <span className="block text-gradient">Your career.</span>
          </Reveal>
          <Reveal delay={0.1}>
            <span className="block text-gradient">Autonomously accelerated.</span>
          </Reveal>
        </motion.h1>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-relaxed text-white/55 sm:text-base">
            {isAuthenticated && userName ? (
              <>Welcome back, {userName}. Your autonomous career agents are live and your dashboard is ready.</>
            ) : (
              <>
                Nexus is an autonomous AI operating system for your career. It monitors opportunities across
                channels, understands each role, drafts personalized applications, fills forms, sends emails, and
                tracks every reply — while you sleep.
              </>
            )}
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link className="relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-colors bg-gradient-to-b from-indigo-500 to-violet-600 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-indigo-400 hover:to-violet-500" to={isAuthenticated ? "/app" : "/signup"}>
              {isAuthenticated ? "Open dashboard" : "Start automating"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="relative inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/[0.08]" to="/waitlist">
              <Play className="h-3.5 w-3.5" /> Watch demo
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="mt-5 flex items-center justify-center gap-5 text-[12px] text-white/40">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> SOC2-ready
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> 2-min setup
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Works everywhere
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.55}>
          <div className="relative mx-auto mt-20 max-w-[1100px] [perspective:2000px]">
            <div className="absolute -inset-12 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.25),transparent_60%)] blur-2xl" />
            <TiltCard className="rounded-2xl">
              <DashboardPreview />
            </TiltCard>
            <FloatingChip
              className="absolute -left-4 top-16 sm:-left-10"
              icon={<Brain className="h-3.5 w-3.5 text-cyan-300" />}
              text="Extracted 12 jobs from WhatsApp"
            />
            <FloatingChip
              className="absolute -right-4 top-40 sm:-right-12"
              icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
              text="Application submitted · Stripe"
              delay={1.2}
            />
            <FloatingChip
              className="absolute -left-2 bottom-20 sm:left-14"
              icon={<Mail className="h-3.5 w-3.5 text-violet-300" />}
              text="Follow-up sent to 3 recruiters"
              delay={2.2}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FloatingChip({
  icon,
  text,
  className = "",
  delay = 0,
}: {
  icon: React.ReactNode;
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3 + delay, ease: [0.16, 1, 0.3, 1] }}
      className={`glass animate-float hidden items-center gap-2 rounded-full px-3 py-1.5 text-[11px] text-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.4)] md:inline-flex ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {icon}
      {text}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard preview                                                 */
/* ------------------------------------------------------------------ */

function DashboardPreview() {
  return (
    <div className="glass glow-border overflow-hidden rounded-2xl">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 text-[11px] text-white/40">nexus.app / dashboard</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          AI agent active
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 p-3 sm:p-4">
        {/* Sidebar */}
        <aside className="col-span-3 hidden flex-col gap-1 md:flex">
          {[
            { i: <LayoutDashboard className="h-3.5 w-3.5" />, l: "Overview", active: true },
            { i: <Activity className="h-3.5 w-3.5" />, l: "Pipeline" },
            { i: <Bot className="h-3.5 w-3.5" />, l: "Agents" },
            { i: <Mail className="h-3.5 w-3.5" />, l: "Inbox" },
            { i: <FileSearch className="h-3.5 w-3.5" />, l: "Opportunities" },
          ].map((it) => (
            <div
              key={it.l}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] ${
                it.active ? "bg-white/[0.06] text-white" : "text-white/55 hover:text-white/80"
              }`}
            >
              {it.i}
              {it.l}
            </div>
          ))}
          <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/40">Today</div>
            <div className="mt-1 font-display text-xl text-white">14 applied</div>
            <div className="text-[11px] text-emerald-300">+38% vs avg</div>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 space-y-3 md:col-span-9">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Applied", v: "1,284", d: "+12%" },
              { l: "Replies", v: "163", d: "+24%" },
              { l: "Interviews", v: "27", d: "+9%" },
              { l: "AI confidence", v: "94%", d: "stable" },
            ].map((k) => (
              <div key={k.l} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[10px] uppercase tracking-wider text-white/40">{k.l}</div>
                <div className="mt-1 font-display text-lg text-white">{k.v}</div>
                <div className="text-[10px] text-emerald-300">{k.d}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-3">
            {/* Chart */}
            <div className="col-span-12 lg:col-span-7 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-white/50">Application velocity</div>
                  <div className="font-display text-base text-white">Last 30 days</div>
                </div>
                <div className="flex gap-1 text-[10px] text-white/40">
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5">1W</span>
                  <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-indigo-200">30D</span>
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5">90D</span>
                </div>
              </div>
              <Sparkline />
            </div>

            {/* Live agent feed */}
            <div className="col-span-12 lg:col-span-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-display text-sm text-white">Agent activity</div>
                <span className="text-[10px] text-white/40">live</span>
              </div>
              <ul className="space-y-2.5 text-[11px]">
                {[
                  { c: "text-emerald-300", t: "Submitted application", s: "Linear · Sr. PM" },
                  { c: "text-cyan-300", t: "Extracted 8 jobs", s: "WhatsApp · #careers" },
                  { c: "text-violet-300", t: "Drafted follow-up", s: "Vercel · Recruiter" },
                  { c: "text-indigo-300", t: "Filled Google form", s: "Anthropic · Eng" },
                  { c: "text-emerald-300", t: "Resume re-ranked", s: "Top match 96%" },
                ].map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CircleDot className={`mt-0.5 h-3 w-3 ${e.c}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-white/85">{e.t}</div>
                      <div className="truncate text-white/40">{e.s}</div>
                    </div>
                    <span className="text-white/30">{i * 2 + 1}m</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities table */}
            <div className="col-span-12 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/5 p-3">
                <div className="font-display text-sm text-white">Live opportunity pipeline</div>
                <span className="text-[10px] text-white/40">Auto-syncing</span>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  {
                    co: "Stripe",
                    r: "Product Designer",
                    m: 96,
                    st: "Applied",
                    bar: "from-emerald-400 to-emerald-500",
                    pill: "bg-emerald-400/10 text-emerald-300",
                  },
                  {
                    co: "Vercel",
                    r: "DX Engineer",
                    m: 92,
                    st: "Drafting",
                    bar: "from-cyan-400 to-cyan-500",
                    pill: "bg-cyan-400/10 text-cyan-300",
                  },
                  {
                    co: "Notion",
                    r: "AI PM",
                    m: 89,
                    st: "Queued",
                    bar: "from-violet-400 to-violet-500",
                    pill: "bg-violet-400/10 text-violet-300",
                  },
                  {
                    co: "Linear",
                    r: "Founding Eng",
                    m: 87,
                    st: "Interview",
                    bar: "from-indigo-400 to-indigo-500",
                    pill: "bg-indigo-400/10 text-indigo-300",
                  },
                ].map((row) => (
                  <div key={row.co} className="grid grid-cols-12 items-center gap-2 px-3 py-2.5 text-[12px]">
                    <div className="col-span-4 flex items-center gap-2 text-white/85">
                      <div className="h-6 w-6 rounded-md bg-gradient-to-br from-white/10 to-white/[0.02] grid place-items-center text-[10px] text-white/70">
                        {row.co[0]}
                      </div>
                      <span className="truncate font-medium">{row.co}</span>
                    </div>
                    <div className="col-span-4 truncate text-white/55">{row.r}</div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full bg-gradient-to-r ${row.bar}`}
                          style={{ width: `${row.m}%` }}
                        />
                      </div>
                      <span className="text-white/50">{row.m}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.pill}`}>
                        {row.st}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Sparkline() {
  const points = [12, 22, 18, 30, 26, 38, 34, 48, 42, 56, 50, 64, 60, 74, 70, 86];
  const max = Math.max(...points);
  const w = 100;
  const h = 38;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div className="mt-3 h-32 w-full">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(99,102,241,0.5)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0)" />
          </linearGradient>
          <linearGradient id="gl" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#ga)" />
        <motion.path
          d={path}
          fill="none"
          stroke="url(#gl)"
          strokeWidth={0.6}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Logos / trust strip                                               */
/* ------------------------------------------------------------------ */

function LogoStrip() {
  const logos = ["Linear", "Vercel", "Notion", "Anthropic", "Stripe", "Raycast", "Perplexity"];
  return (
    <section className="border-y border-white/5 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-white/35">
          Powering applicants targeting
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
          {logos.map((l) => (
            <span key={l} className="font-display text-base text-white/70 transition-opacity hover:opacity-100">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats                                                             */
/* ------------------------------------------------------------------ */

function Stats() {
  const stats = [
    { v: "412K+", l: "Applications automated", s: <TrendingUp className="h-4 w-4 text-cyan-300" /> },
    { v: "1.2M", l: "Hours saved this year", s: <Zap className="h-4 w-4 text-violet-300" /> },
    { v: "28K", l: "Opportunities tracked daily", s: <Activity className="h-4 w-4 text-indigo-300" /> },
    { v: "94%", l: "AI extraction accuracy", s: <Brain className="h-4 w-4 text-emerald-300" /> },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.l} delay={i * 0.08}>
              <TiltCard className="glass glow-border h-full rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-white/40">{s.l}</span>
                  {s.s}
                </div>
                <div className="mt-4 font-display text-4xl text-gradient">{s.v}</div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                          */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: MessageSquare,
    title: "WhatsApp Opportunity Reader",
    desc: "Joins career groups, reads messages, and extracts every job in real time — no copy-paste.",
  },
  {
    icon: Brain,
    title: "AI Job Extraction",
    desc: "Understands role, stack, comp, and fit from any message, PDF, or page. Structured automatically.",
  },
  {
    icon: FileText,
    title: "Auto Google Form Filling",
    desc: "Fills application forms with your profile, answers screening questions, attaches resumes.",
  },
  {
    icon: Mail,
    title: "AI Email Automation",
    desc: "Drafts and sends personalized outreach and follow-ups in your voice.",
  },
  {
    icon: FileSearch,
    title: "Resume Intelligence",
    desc: "Auto-tailors your resume per role with measurable keyword and impact alignment.",
  },
  {
    icon: LayoutDashboard,
    title: "Career Dashboard",
    desc: "A single pane of glass for every pipeline, every reply, every interview.",
  },
  {
    icon: Activity,
    title: "Application Tracking",
    desc: "Tracks status across email, ATS, and channels — never lose a thread again.",
  },
  {
    icon: Bot,
    title: "Autonomous Browser Agent",
    desc: "A headless agent navigates job boards and ATS systems and applies for you.",
  },
];

function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHeader
            eyebrow="The system"
            title={
              <>
                Eight agents.<br />
                <span className="text-gradient">One autonomous career.</span>
              </>
            }
            subtitle="Nexus is a network of specialized AI agents that handle every step of the job search loop — together, end to end."
          />
        </Reveal>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <TiltCard className="group glass glow-border relative h-full rounded-2xl p-5 transition-shadow hover:shadow-[0_20px_60px_-20px_rgba(99,102,241,0.5)]">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <f.icon className="h-5 w-5 text-white/90" />
                  </div>
                  <h3 className="font-display mt-4 text-[15px] font-semibold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{f.desc}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How it works                                                      */
/* ------------------------------------------------------------------ */

const steps = [
  { t: "Monitor", d: "Nexus listens to WhatsApp groups, inboxes, boards, and feeds 24/7.", icon: Globe },
  { t: "Extract", d: "Each opportunity is parsed into structured data with confidence scoring.", icon: Brain },
  { t: "Understand", d: "The agent matches role context to your profile and ranks fit.", icon: FileSearch },
  { t: "Apply", d: "Forms filled, emails sent, ATS navigated — autonomously.", icon: Bot },
  { t: "Track", d: "Every reply, status change, and interview lives in one timeline.", icon: Activity },
];

function HowItWorks() {
  return (
    <section id="workflow" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHeader
            eyebrow="How it works"
            title={
              <>
                A continuous loop —<br />
                <span className="text-gradient">running while you live your life.</span>
              </>
            }
            subtitle="Five orchestrated stages. Zero manual handoff."
          />
        </Reveal>

        <div className="relative mt-20">
          {/* connection line */}
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent md:block" />
          <div className="grid gap-8 md:grid-cols-5">
            {steps.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.08} className="relative">
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0B1020] ring-1 ring-white/10 shadow-[0_0_30px_rgba(99,102,241,0.35)]">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 blur-md" />
                  <s.icon className="relative h-5 w-5 text-white" />
                </div>
                <div className="mt-5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-white/40">Step {i + 1}</div>
                  <h3 className="font-display mt-1 text-base font-semibold text-white">{s.t}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Showcase                                                          */
/* ------------------------------------------------------------------ */

function Showcase() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">The cockpit</p>
              <h2 className="font-display mt-3 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                A dashboard that actually <span className="text-gradient">thinks with you.</span>
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-white/55">
                Real-time AI confidence scores, live agent logs, and a clean opportunity pipeline. Inspect every
                decision before — or after — your agents act.
              </p>
              <ul className="mt-7 space-y-3 text-[13.5px] text-white/70">
                {[
                  "Per-opportunity AI fit and reasoning",
                  "Auditable, replayable agent actions",
                  "Granular controls — pause, edit, override",
                  "Calendar-aware interview scheduling",
                ].map((l) => (
                  <li key={l} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <TiltCard className="[perspective:1500px]">
              <DashboardPreview />
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonials                                                      */
/* ------------------------------------------------------------------ */

const testimonials = [
  {
    q: "I went from 4 applications a week to 60. Two offers in 11 days. Nexus is unreasonable in the best way.",
    n: "Maya Chen",
    r: "Product Designer · ex-Figma",
  },
  {
    q: "It quietly filled three ATS forms while I was on a flight. The follow-ups it drafted sounded like me.",
    n: "Aarav Patel",
    r: "Senior SWE · Looking at AI infra",
  },
  {
    q: "The AI fit score is the only one I trust. It rejects roles I would have wasted a day applying to.",
    n: "Sofia Rinaldi",
    r: "PM · Climate tech",
  },
  {
    q: "Honestly feels like I hired a chief of staff for my job search. Polished, calm, relentless.",
    n: "Daniel Okafor",
    r: "Founding engineer",
  },
];

function Testimonials() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHeader
            eyebrow="Loved by ambitious people"
            title={
              <>
                Built for people who refuse <br />
                <span className="text-gradient">to be a spreadsheet.</span>
              </>
            }
          />
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <Reveal key={t.n} delay={i * 0.06}>
              <TiltCard className="glass glow-border h-full rounded-2xl p-6">
                <p className="font-display text-[17px] leading-snug text-white/90">"{t.q}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 via-violet-500 to-cyan-400 ring-1 ring-white/10" />
                  <div>
                    <div className="text-[13px] font-medium text-white">{t.n}</div>
                    <div className="text-[11.5px] text-white/45">{t.r}</div>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                               */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="glass glow-border relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16 sm:py-24">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.35),transparent_60%)] blur-2xl" />
          <div className="absolute inset-x-0 -bottom-20 h-40 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.35),transparent_70%)] blur-2xl" />
          <Reveal>
            <h2 className="font-display relative text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              Let AI handle your <br />
              <span className="text-gradient">career pipeline.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="relative mx-auto mt-5 max-w-xl text-[15px] text-white/55">
              Plug Nexus into your channels and inbox. We'll handle the rest — quietly, accurately, and on
              your terms.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link className="relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-colors bg-gradient-to-b from-indigo-500 to-violet-600 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-indigo-400 hover:to-violet-500" to="/signup">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="relative inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/[0.08]" to="/waitlist">Join waitlist</Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                            */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="relative pb-12 pt-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="mt-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-400 to-violet-600" />
            <span className="font-display text-sm font-semibold text-white">Nexus</span>
            <span className="text-[12px] text-white/35">· Autonomous Career OS</span>
          </div>
          <div className="flex gap-6 text-[12px] text-white/50">
            {[
              { label: "Product", to: "/features" },
              { label: "Pricing", to: "/pricing" },
              { label: "Help", to: "/help" },
              { label: "Sign in", to: "/login" },
              { label: "Get started", to: "/signup" },
            ].map((item) => (
              <Link key={item.label} to={item.to} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="text-[11.5px] text-white/35">© {new Date().getFullYear()} Nexus Labs, Inc.</div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Misc                                                              */
/* ------------------------------------------------------------------ */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">{eyebrow}</p>
      <h2 className="font-display mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
        {title}
      </h2>
      {subtitle && <p className="mx-auto mt-5 max-w-xl text-[15px] text-white/55">{subtitle}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  return (
    <div className="relative min-h-screen text-white">
      <BackgroundFX />
      <Nav />
      <main className="relative">
        <Hero isAuthenticated={isAuthenticated} userName={user?.name} />
        <LogoStrip />
        <Stats />
        <Features />
        <HowItWorks />
        <Showcase />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}