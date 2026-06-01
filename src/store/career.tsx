import { careerService } from "@/services/career/careerService";
import { ApiRequestError } from "@/services/api/httpClient";
import type { CareerProfile, CareerProfileUpdate, OnboardingStatus } from "@/types/career";
import type { User } from "@/types/user";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CareerState = {
  profile: CareerProfile | null;
  onboarding: OnboardingStatus | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (update: CareerProfileUpdate) => Promise<CareerProfile>;
  completeOnboarding: () => Promise<void>;
};

const CareerContext = createContext<CareerState | null>(null);

export function CareerProvider({ user, children }: { user: User | null; children: ReactNode }) {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setOnboarding(null);
      return;
    }
    setIsRefreshing(true);
    setError(null);
    try {
      const [profileData, statusData] = await Promise.all([
        careerService.getProfile(),
        careerService.getOnboardingStatus(),
      ]);
      setProfile(profileData);
      setOnboarding(statusData);
    } catch (err) {
      let message = "Failed to load career profile";
      if (err instanceof ApiRequestError) {
        message = err.message;
      } else if (err instanceof TypeError && err.message === "Failed to fetch") {
        message =
          "Cannot reach the API at http://localhost:8000. Start the backend with: cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000";
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setOnboarding(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void refresh().finally(() => setIsLoading(false));
  }, [user?.id, refresh]);

  const updateProfile = useCallback(
    async (update: CareerProfileUpdate) => {
      const next = await careerService.updateProfile(update);
      setProfile(next);
      const status = await careerService.getOnboardingStatus();
      setOnboarding(status);
      return next;
    },
    [],
  );

  const completeOnboarding = useCallback(async () => {
    const result = await careerService.completeOnboarding();
    setProfile(result.profile);
    setOnboarding(result.onboarding);
  }, []);

  const value = useMemo<CareerState>(
    () => ({
      profile,
      onboarding,
      isLoading,
      isRefreshing,
      error,
      refresh,
      updateProfile,
      completeOnboarding,
    }),
    [profile, onboarding, isLoading, isRefreshing, error, refresh, updateProfile, completeOnboarding],
  );

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
}

export function useCareerContext() {
  const ctx = useContext(CareerContext);
  if (!ctx) throw new Error("useCareerContext must be used within CareerProvider");
  return ctx;
}
