import type { IntegrationId } from "@/types/workspace";
import { Github, Linkedin, Mail, MessageCircle } from "lucide-react";

export const PLATFORM_IDS: IntegrationId[] = ["whatsapp", "linkedin", "gmail", "github"];

export const PLATFORMS = [
  {
    id: "whatsapp" as const,
    name: "WhatsApp",
    desc: "Opportunity alerts and quick approvals from your phone.",
    icon: MessageCircle,
  },
  {
    id: "linkedin" as const,
    name: "LinkedIn",
    desc: "Profile sync and opportunity discovery from your network.",
    icon: Linkedin,
  },
  {
    id: "gmail" as const,
    name: "Gmail",
    desc: "Email triage and recruiter reply drafting.",
    icon: Mail,
  },
  {
    id: "github" as const,
    name: "GitHub",
    desc: "Showcase projects and technical signal for roles.",
    icon: Github,
  },
];
