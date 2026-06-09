export type SourceType =
  | "WHATSAPP"
  | "LINKEDIN"
  | "INTERNSHALA"
  | "UNSTOP"
  | "WELLFOUND"
  | "THUB"
  | "STUDENT_TRIBE"
  | "MANUAL";

export type OpportunityType =
  | "INTERNSHIP"
  | "JOB"
  | "HACKATHON"
  | "COMPETITION"
  | "SCHOLARSHIP";

export type Opportunity = {
  id: string;
  title: string;
  company: string;
  sourceName: string;
  sourceType: SourceType;
  description: string | null;
  applyLink: string | null;
  location: string | null;
  deadline: string | null;
  requiredSkills: string[];
  opportunityType: OpportunityType;
  createdAt: string;
  updatedAt: string;
  isSaved: boolean;
};

export type OpportunityCreateInput = {
  title: string;
  company: string;
  sourceName?: string;
  sourceType: SourceType;
  description?: string;
  applyLink?: string;
  location?: string;
  deadline?: string;
  requiredSkills: string[];
  opportunityType: OpportunityType;
};

export const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "MANUAL", label: "Manual" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "INTERNSHALA", label: "Internshala" },
  { value: "UNSTOP", label: "Unstop" },
  { value: "WELLFOUND", label: "Wellfound" },
  { value: "THUB", label: "T-Hub" },
  { value: "STUDENT_TRIBE", label: "Student Tribe" },
];

export const OPPORTUNITY_TYPE_OPTIONS: { value: OpportunityType; label: string }[] = [
  { value: "INTERNSHIP", label: "Internship" },
  { value: "JOB", label: "Job" },
  { value: "HACKATHON", label: "Hackathon" },
  { value: "COMPETITION", label: "Competition" },
  { value: "SCHOLARSHIP", label: "Scholarship" },
];

export function formatOpportunityType(value: OpportunityType): string {
  return OPPORTUNITY_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function formatSourceType(value: SourceType): string {
  return SOURCE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
