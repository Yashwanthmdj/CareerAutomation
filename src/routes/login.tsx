import { createFileRoute, Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, Github, Sparkles, Lock, Mail } from "lucide-react";
import BackgroundFX from "@/components/shared/BackgroundFX";
import { authService } from "@/services/auth/authService";
import { useSession } from "@/store/session";
import { RequireGuest } from "@/components/auth/AuthGuards";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Nexus" }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <RequireGuest>
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundFX />
        <div className="grid min-h-screen lg:grid-cols-2">
          <AuthCard mode="login" />
          <AuthVisual />
        </div>
      </div>
    </RequireGuest>
  );
}

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const { setSession } = useSession();
  const [pwd, setPwd] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const strength = Math.min(4, Math.floor(pwd.length / 3));
  const strengthColor = ["bg-white/10", "bg-rose-400", "bg-amber-400", "bg-cyan-400", "bg-emerald-400"][strength];

  return (
    <div className="relative flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="mb-8 inline-flex items-center gap-2">
          <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-indigo-400 to-violet-600 shadow-[0_0_24px_rgba(99,102,241,0.55)]">
            <div className="absolute inset-[3px] rounded-[5px] bg-[#050816]/70 grid place-items-center">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            </div>
          </div>
          <span className="font-display text-[15px] font-semibold text-white">Nexus</span>
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
          {mode === "login" ? "Welcome back." : "Create your account."}
        </h1>
        <p className="mt-2 text-sm text-white/55">
          {mode === "login" ? "Sign in to your autonomous workspace." : "Onboard in under 60 seconds."}
        </p>

        <div className="mt-7 grid gap-2">
          <button className="glass flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-white transition-all hover:bg-white/[0.08]">
            <GoogleIcon /> Continue with Google
          </button>
          <button className="glass flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-white transition-all hover:bg-white/[0.08]">
            <Github className="h-4 w-4" /> Continue with GitHub
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/30">
          <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
        </div>

        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (loading) return;
            setError(null);
            if (mode === "signup" && pwd !== confirmPassword) {
              setError("Passwords do not match.");
              return;
            }
            setLoading(true);
            try {
              const session =
                mode === "login"
                  ? await authService.signIn({ email, password: pwd })
                  : await authService.signUp({ name, email, password: pwd });
              setSession(session);
              await navigate({ to: "/app" });
            } catch (err) {
              const message = err instanceof Error ? err.message : "Authentication failed";
              setError(message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {mode === "signup" && (
            <FloatingField
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <FloatingField
            icon={<Mail className="h-3.5 w-3.5" />}
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <FloatingField
            icon={<Lock className="h-3.5 w-3.5" />}
            label="Password"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "signup" && (
            <>
              <FloatingField
                icon={<Lock className="h-3.5 w-3.5" />}
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <div className="flex gap-1 pt-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColor : "bg-white/10"}`}
                  />
                ))}
              </div>
            </>
          )}

          {error && <p className="text-xs text-rose-300">{error}</p>}

          {mode === "login" && (
            <div className="flex items-center justify-between pt-1 text-[12.5px]">
              <label className="flex items-center gap-2 text-white/60">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-white/20 bg-transparent accent-indigo-500" />
                Remember me
              </label>
              <Link to="/help" className="text-white/60 hover:text-white">Forgot password?</Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_15px_40px_-15px_rgba(99,102,241,0.8)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in…" : mode === "login" ? "Sign in" : "Create account"}{" "}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-white/55">
          {mode === "login" ? (
            <>New here? <Link to="/signup" className="text-cyan-300 hover:text-cyan-200">Create an account</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="text-cyan-300 hover:text-cyan-200">Sign in</Link></>
          )}
        </p>
      </motion.div>
    </div>
  );
}

function FloatingField({
  icon, label, ...rest
}: { icon: React.ReactNode; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="group relative">
      <input
        {...rest}
        placeholder={label}
        className="peer w-full rounded-xl border border-white/10 bg-white/[0.03] px-10 py-3 text-sm text-white placeholder:text-white/30 transition-all focus:border-indigo-400/60 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)] focus:outline-none"
      />
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 transition-colors peer-focus:text-cyan-300">
        {icon}
      </span>
    </div>
  );
}

export function AuthVisual() {
  return (
    <div className="relative hidden overflow-hidden border-l border-white/5 lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,211,238,0.18),transparent_60%)]" />
      <div className="relative flex h-full flex-col justify-between p-12">
        <div className="font-display text-[11px] uppercase tracking-[0.22em] text-white/40">
          // nexus.os
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="glass relative rounded-3xl p-6 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Agent active · 04:21 uptime
          </div>
          <div className="mt-5 space-y-3">
            {[
              { t: "Stripe · Senior PM", s: "match 94%", c: "emerald" },
              { t: "Vercel · DX Engineer", s: "applied", c: "cyan" },
              { t: "Linear · Founding Designer", s: "drafted reply", c: "indigo" },
              { t: "Anthropic · Research Eng", s: "interview Tue", c: "violet" },
            ].map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5"
              >
                <span className="text-[13px] text-white/85">{r.t}</span>
                <span className={`text-[11px] uppercase tracking-[0.14em] text-${r.c}-300`}>{r.s}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <blockquote className="text-white/70">
          <p className="font-display text-xl leading-snug">
            "Landed 3 interviews in week one. Felt illegal."
          </p>
          <footer className="mt-3 text-xs uppercase tracking-[0.18em] text-white/40">
            — Priya N., Software Engineer
          </footer>
        </blockquote>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5H12z"/>
    </svg>
  );
}