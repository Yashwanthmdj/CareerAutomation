import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { CareerGate } from "@/components/career/CareerGate";
import { ResumeGate } from "@/components/career/ResumeGate";
import { SessionProvider } from "@/store/session";

export function AppProviders({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CareerGate>
          <ResumeGate>{children}</ResumeGate>
        </CareerGate>
      </SessionProvider>
    </QueryClientProvider>
  );
}

