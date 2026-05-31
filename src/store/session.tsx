import type { Session } from "@/types/auth";
import { authService } from "@/services/auth/authService";
import { getStoredAccessToken, setStoredAccessToken } from "@/services/api/client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type SessionState = {
  session: Session | null;
  setSession: (session: Session | null) => void;
  logout: () => Promise<void>;
  accessToken: string | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({
  initialSession = null,
  children,
}: {
  initialSession?: Session | null;
  children: React.ReactNode;
}) {
  const [session, setSessionState] = useState<Session | null>(initialSession);
  const [isInitializing, setIsInitializing] = useState(() => !!getStoredAccessToken());

  const setSession = useCallback((next: Session | null) => {
    setStoredAccessToken(next?.accessToken ?? null);
    setSessionState(next);
    setIsInitializing(false);
  }, []);

  const logout = useCallback(async () => {
    await authService.signOut();
    setStoredAccessToken(null);
    setSessionState(null);
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token || session) {
      setIsInitializing(false);
      return;
    }

    authService
      .getCurrentUser()
      .then((user) => {
        setSessionState({ accessToken: token, user });
      })
      .catch(() => {
        setStoredAccessToken(null);
        setSessionState(null);
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, [session]);

  const value = useMemo<SessionState>(
    () => ({
      session,
      setSession,
      logout,
      accessToken: session?.accessToken ?? null,
      isInitializing,
      isAuthenticated: !!session,
    }),
    [isInitializing, logout, session, setSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

