import { createFileRoute } from "@tanstack/react-router";
import { RequireGuest } from "@/components/auth/AuthGuards";
import BackgroundFX from "@/components/shared/BackgroundFX";
import { AuthCard, AuthVisual } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Nexus" }] }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <RequireGuest>
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundFX />
        <div className="grid min-h-screen lg:grid-cols-2">
          <AuthCard mode="signup" />
          <AuthVisual />
        </div>
      </div>
    </RequireGuest>
  );
}