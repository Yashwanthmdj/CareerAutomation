import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth, RequireIncompleteOnboarding } from "@/components/auth/AuthGuards";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — Nexus" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <RequireAuth>
      <RequireIncompleteOnboarding>
        <OnboardingWizard />
      </RequireIncompleteOnboarding>
    </RequireAuth>
  );
}
