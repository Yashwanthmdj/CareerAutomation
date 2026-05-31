import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/components/landing/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus — Autonomous Career OS" },
      {
        name: "description",
        content:
          "Nexus is the autonomous AI that monitors opportunities, extracts jobs, applies for you, and tracks every application — end to end.",
      },
      { property: "og:title", content: "Nexus — Autonomous Career OS" },
      {
        property: "og:description",
        content: "Your career. Autonomously accelerated.",
      },
    ],
  }),
  component: Landing,
});
