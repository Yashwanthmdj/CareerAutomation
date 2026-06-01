import { useAuth } from "@/hooks/useAuth";
import { CareerProvider } from "@/store/career";

export function CareerGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <CareerProvider user={user}>{children}</CareerProvider>;
}
