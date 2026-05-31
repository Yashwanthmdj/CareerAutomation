import { useSession } from "@/store/session";

export function useAuth() {
  const { session, setSession, logout, isInitializing, isAuthenticated } = useSession();
  return {
    session,
    user: session?.user ?? null,
    setSession,
    logout,
    isInitializing,
    isAuthenticated,
  };
}

