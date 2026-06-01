export const AUTOMATION_AGENTS = [
  {
    id: "apply",
    name: "Apply Agent",
    desc: "Submits tailored applications across job portals.",
  },
  {
    id: "email",
    name: "Email Agent",
    desc: "Drafts and sends recruiter follow-ups.",
  },
  {
    id: "form",
    name: "Form Agent",
    desc: "Completes multi-step ATS and application forms.",
  },
  {
    id: "scout",
    name: "Opportunity Scout",
    desc: "Monitors connected channels for high-fit roles.",
  },
] as const;

export type AgentId = (typeof AUTOMATION_AGENTS)[number]["id"];
