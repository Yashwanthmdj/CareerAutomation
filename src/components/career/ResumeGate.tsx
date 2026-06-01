import { useAuth } from "@/hooks/useAuth";
import { ResumeProvider } from "@/store/resume";

export function ResumeGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <ResumeProvider user={user}>{children}</ResumeProvider>;
}
