import { useAuth } from "@/hooks/useAuth";
import { useCareer } from "@/hooks/useCareer";
import { Navigate } from "@tanstack/react-router";

function AuthLoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
      <div className="glass rounded-2xl px-5 py-3 text-sm text-white/80">{label}</div>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isInitializing, isAuthenticated } = useAuth();

  if (isInitializing) return <AuthLoadingScreen label="Restoring your session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { isInitializing, isAuthenticated } = useAuth();

  if (isInitializing) return <AuthLoadingScreen label="Checking your account..." />;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const { isInitializing, isAuthenticated } = useAuth();
  const { onboarding, isLoading, error } = useCareer();

  if (isInitializing || (isAuthenticated && isLoading)) {
    return <AuthLoadingScreen label="Loading your career profile..." />;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] px-4 text-white">
        <div className="glass max-w-md rounded-2xl p-6 text-center">
          <p className="text-sm font-medium text-white">{error}</p>
          <p className="mt-3 text-xs text-white/45">
            Check the backend terminal for errors. Health check:{" "}
            <a href="http://localhost:8000/health" className="text-cyan-300 hover:underline" target="_blank" rel="noreferrer">
              localhost:8000/health
            </a>
          </p>
        </div>
      </div>
    );
  }
  if (!onboarding?.isCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function RequireIncompleteOnboarding({ children }: { children: React.ReactNode }) {
  const { isInitializing, isAuthenticated } = useAuth();
  const { onboarding, isLoading } = useCareer();

  if (isInitializing || (isAuthenticated && isLoading)) {
    return <AuthLoadingScreen label="Preparing onboarding..." />;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (onboarding?.isCompleted) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
