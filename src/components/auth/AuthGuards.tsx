import { useAuth } from "@/hooks/useAuth";
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

