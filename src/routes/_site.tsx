import { createFileRoute, Outlet } from "@tanstack/react-router";
import BackgroundFX from "@/components/shared/BackgroundFX";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export const Route = createFileRoute("/_site")({
  component: SiteLayout,
});

function SiteLayout() {
  return (
    <div className="relative min-h-screen">
      <BackgroundFX />
      <Navbar />
      <main className="relative">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}