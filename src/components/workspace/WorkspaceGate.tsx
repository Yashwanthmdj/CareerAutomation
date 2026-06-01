import { useAuth } from "@/hooks/useAuth";
import { WorkspaceProvider } from "@/store/workspace";

export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <WorkspaceProvider user={user}>{children}</WorkspaceProvider>;
}
