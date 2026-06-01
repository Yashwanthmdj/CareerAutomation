import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles, X, Plus } from "lucide-react";
import BackgroundFX from "@/components/shared/BackgroundFX";
import { useAuth } from "@/hooks/useAuth";
import { useCareer } from "@/hooks/useCareer";
import { ApiRequestError } from "@/services/api/httpClient";
import {
  CURRENT_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  SUGGESTED_ROLES,
  WORK_PREFERENCE_OPTIONS,
  type CareerProfileUpdate,
  type CurrentStatus,
  type EmploymentType,
  type WorkPreference,
} from "@/types/career";

const STEPS = [
  { id: 1, title: "Personal", subtitle: "Who you are" },
  { id: 2, title: "Career", subtitle: "Where you are today" },
  { id: 3, title: "Targets", subtitle: "Where you're headed" },
  { id: 4, title: "Automation", subtitle: "Future preferences" },
];

type FormState = {
  fullName: string;
  phone: string;
  location: string;
  college: string;
  degree: string;
  graduationYear: string;
  currentStatus: CurrentStatus | "";
  experience: string;
  skills: string[];
  preferredRoles: string[];
  preferredLocations: string[];
  employmentType: EmploymentType | "";
  workPreference: WorkPreference | "";
  expectedSalary: string;
  autoApply: boolean;
  requireApproval: boolean;
  dailyOpportunityLimit: number;
};

function emptyForm(name = ""): FormState {
  return {
    fullName: name,
    phone: "",
    location: "",
    college: "",
    degree: "",
    graduationYear: "",
    currentStatus: "",
    experience: "",
    skills: [],
    preferredRoles: [],
    preferredLocations: [],
    employmentType: "",
    workPreference: "",
    expectedSalary: "",
    autoApply: false,
    requireApproval: true,
    dailyOpportunityLimit: 10,
  };
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, onboarding, updateProfile, completeOnboarding } = useCareer();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => emptyForm(user?.name ?? ""));
  const [skillInput, setSkillInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setStep(onboarding?.currentStep ?? 1);
    setForm({
      fullName: profile.fullName,
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      college: profile.college ?? "",
      degree: profile.degree ?? "",
      graduationYear: profile.graduationYear ?? "",
      currentStatus: profile.currentStatus ?? "",
      experience: profile.experience ?? "",
      skills: profile.skills,
      preferredRoles: profile.preferredRoles,
      preferredLocations: profile.preferredLocations,
      employmentType: profile.employmentType ?? "",
      workPreference: profile.workPreference ?? "",
      expectedSalary: profile.expectedSalary ?? "",
      autoApply: profile.autoApply,
      requireApproval: profile.requireApproval,
      dailyOpportunityLimit: profile.dailyOpportunityLimit,
    });
  }, [profile, onboarding?.currentStep]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (nextStep?: number): CareerProfileUpdate => ({
    currentStep: nextStep ?? step,
    fullName: form.fullName,
    phone: form.phone,
    location: form.location,
    college: form.college,
    degree: form.degree,
    graduationYear: form.graduationYear,
    currentStatus: form.currentStatus || undefined,
    experience: form.experience,
    skills: form.skills,
    preferredRoles: form.preferredRoles,
    preferredLocations: form.preferredLocations,
    employmentType: form.employmentType || undefined,
    workPreference: form.workPreference || undefined,
    expectedSalary: form.expectedSalary || undefined,
    autoApply: form.autoApply,
    requireApproval: form.requireApproval,
    dailyOpportunityLimit: form.dailyOpportunityLimit,
  });

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!form.fullName.trim()) return "Full name is required.";
      if (!form.phone.trim()) return "Phone number is required.";
      if (!form.location.trim()) return "Location is required.";
      if (!form.college.trim()) return "College is required.";
      if (!form.degree.trim()) return "Degree is required.";
      if (!form.graduationYear.trim()) return "Graduation year is required.";
    }
    if (s === 2) {
      if (!form.currentStatus) return "Select your current status.";
      if (!form.experience.trim()) return "Experience is required.";
      if (form.skills.length === 0) return "Add at least one skill.";
    }
    if (s === 3) {
      if (form.preferredRoles.length === 0) return "Add at least one preferred role.";
      if (form.preferredLocations.length === 0) return "Add at least one preferred location.";
      if (!form.employmentType) return "Select employment type.";
      if (!form.workPreference) return "Select work preference.";
    }
    return null;
  };

  const saveStep = async (nextStep?: number) => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(buildPayload(nextStep));
      if (nextStep) setStep(nextStep);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const details = err.details as { detail?: { errors?: string[] } } | undefined;
        const errors = details?.detail?.errors;
        setError(errors?.join(" ") ?? err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to save progress");
      }
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (step < 4) {
      await saveStep(step + 1);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveStep(4);
      await completeOnboarding();
      await navigate({ to: "/app" });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const details = err.details as { detail?: { errors?: string[] } } | undefined;
        const errors = details?.detail?.errors;
        setError(errors?.join(" ") ?? err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to complete onboarding");
      }
    } finally {
      setSaving(false);
    }
  };

  const addTag = (
    value: string,
    key: "skills" | "preferredRoles" | "preferredLocations",
    clear: () => void,
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!form[key].includes(trimmed)) {
      set(key, [...form[key], trimmed] as FormState[typeof key]);
    }
    clear();
  };

  const removeTag = (key: "skills" | "preferredRoles" | "preferredLocations", tag: string) => {
    set(
      key,
      form[key].filter((item) => item !== tag) as FormState[typeof key],
    );
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <BackgroundFX />
      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Sparkles className="h-4 w-4 text-cyan-300" />
            </div>
            <span className="font-display text-[15px] font-semibold">Nexus</span>
          </div>
          <button
            type="button"
            onClick={() => void saveStep(step).then(() => navigate({ to: "/" }))}
            className="text-[12px] text-white/50 hover:text-white"
            disabled={saving}
          >
            Save & exit
          </button>
        </div>

        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/80">Career identity</div>
          <h1 className="font-display mt-2 text-2xl font-semibold sm:text-3xl">Build your intelligence profile</h1>
          <p className="mt-2 text-[13px] text-white/55">Under 3 minutes · Step {step} of 4</p>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`rounded-lg px-2 py-2 text-center text-[10px] uppercase tracking-[0.1em] ${
                  s.id === step
                    ? "bg-white/10 text-white ring-1 ring-white/15"
                    : s.id < step
                      ? "text-cyan-300/80"
                      : "text-white/35"
                }`}
              >
                {s.title}
              </div>
            ))}
          </div>
        </div>

        <motion.div layout className="glass rounded-2xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.35 }}
            >
              <div className="mb-6">
                <div className="font-display text-lg font-semibold">{STEPS[step - 1].title}</div>
                <div className="text-[13px] text-white/50">{STEPS[step - 1].subtitle}</div>
              </div>

              {step === 1 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name" value={form.fullName} onChange={(v) => set("fullName", v)} className="sm:col-span-2" />
                  <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
                  <Field label="Location" value={form.location} onChange={(v) => set("location", v)} placeholder="City, Country" />
                  <Field label="College" value={form.college} onChange={(v) => set("college", v)} />
                  <Field label="Degree" value={form.degree} onChange={(v) => set("degree", v)} />
                  <Field label="Graduation year" value={form.graduationYear} onChange={(v) => set("graduationYear", v)} placeholder="2026" />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">Current status</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {CURRENT_STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => set("currentStatus", opt.value)}
                          className={`rounded-xl border px-3 py-2.5 text-[13px] transition-colors ${
                            form.currentStatus === opt.value
                              ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                              : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field
                    label="Experience"
                    value={form.experience}
                    onChange={(v) => set("experience", v)}
                    multiline
                    placeholder="Years of experience, domains, highlights…"
                  />
                  <TagField
                    label="Skills"
                    tags={form.skills}
                    input={skillInput}
                    onInput={setSkillInput}
                    onAdd={() => addTag(skillInput, "skills", () => setSkillInput(""))}
                    onRemove={(t) => removeTag("skills", t)}
                    placeholder="Type a skill and press Enter"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <TagField
                    label="Preferred roles"
                    tags={form.preferredRoles}
                    input={roleInput}
                    onInput={setRoleInput}
                    onAdd={() => addTag(roleInput, "preferredRoles", () => setRoleInput(""))}
                    onRemove={(t) => removeTag("preferredRoles", t)}
                    placeholder="e.g. Software Engineer"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          if (!form.preferredRoles.includes(role)) {
                            set("preferredRoles", [...form.preferredRoles, role]);
                          }
                        }}
                        className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/60 ring-1 ring-white/10 hover:text-white"
                      >
                        + {role}
                      </button>
                    ))}
                  </div>
                  <TagField
                    label="Preferred locations"
                    tags={form.preferredLocations}
                    input={locationInput}
                    onInput={setLocationInput}
                    onAdd={() => addTag(locationInput, "preferredLocations", () => setLocationInput(""))}
                    onRemove={(t) => removeTag("preferredLocations", t)}
                    placeholder="e.g. San Francisco, Remote"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField
                      label="Employment type"
                      value={form.employmentType}
                      options={EMPLOYMENT_TYPE_OPTIONS}
                      onChange={(v) => set("employmentType", v as EmploymentType)}
                    />
                    <SelectField
                      label="Work preference"
                      value={form.workPreference}
                      options={WORK_PREFERENCE_OPTIONS}
                      onChange={(v) => set("workPreference", v as WorkPreference)}
                    />
                  </div>
                  <Field
                    label="Expected salary (optional)"
                    value={form.expectedSalary}
                    onChange={(v) => set("expectedSalary", v)}
                    placeholder="$120k – $150k"
                  />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-[13px] text-white/55">
                    These preferences are stored for future automation phases. No agents will run in Phase 2.
                  </p>
                  <ToggleRow
                    label="Auto apply"
                    description="Automatically submit when match threshold is met (future phase)."
                    checked={form.autoApply}
                    onChange={(v) => set("autoApply", v)}
                  />
                  <ToggleRow
                    label="Require approval"
                    description="Review applications before submission (recommended)."
                    checked={form.requireApproval}
                    onChange={(v) => set("requireApproval", v)}
                  />
                  <Field
                    label="Daily opportunity limit"
                    value={String(form.dailyOpportunityLimit)}
                    onChange={(v) => set("dailyOpportunityLimit", Math.max(1, Math.min(100, Number(v) || 10)))}
                    type="number"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 text-[13px] text-rose-300">{error}</p>}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={step === 1 || saving}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-[13px] text-white/70 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleContinue()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 px-5 py-2.5 text-[13px] font-medium text-white shadow-[0_12px_32px_-12px_rgba(99,102,241,0.8)] disabled:opacity-70"
            >
              {saving ? "Saving…" : step === 4 ? "Complete onboarding" : "Continue"}
              {step < 4 && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="mt-1.5 w-full resize-none rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      )}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1.5 w-full rounded-xl border border-white/5 bg-[#0a0f1e] px-3 py-2 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TagField({
  label,
  tags,
  input,
  onInput,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  tags: string[];
  input: string;
  onInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{label}</span>
      <div className="mt-1.5 flex gap-2">
        <input
          value={input}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
        <button
          type="button"
          onClick={onAdd}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/80 ring-1 ring-white/10"
            >
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="text-white/40 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <div>
        <div className="text-[13px] font-medium text-white">{label}</div>
        <div className="mt-0.5 text-[12px] text-white/50">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-cyan-400/80" : "bg-white/10"}`}
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}
