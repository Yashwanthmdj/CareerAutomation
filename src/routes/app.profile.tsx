import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { MapPin, Sparkles, Save, Plus, X, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCareer } from "@/hooks/useCareer";
import { useResume } from "@/hooks/useResume";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatResumeDate } from "@/types/resume";
import {
  CURRENT_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  WORK_PREFERENCE_OPTIONS,
  type CareerProfileUpdate,
  type CurrentStatus,
  type EmploymentType,
  type WorkPreference,
} from "@/types/career";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile — Nexus" }] }),
  component: Profile,
});

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

function Profile() {
  const { user } = useAuth();
  const { profile, updateProfile } = useCareer();
  const { metrics } = useWorkspace();
  const { summary, activeResume } = useResume();
  const [form, setForm] = useState<FormState | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
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
  }, [profile]);

  const initials = (form?.fullName ?? user?.name ?? "NU")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const payload: CareerProfileUpdate = {
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
      };
      await updateProfile(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!form || !profile) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-white/60">Loading career profile…</div>
    );
  }

  const statusLabel = CURRENT_STATUS_OPTIONS.find((o) => o.value === form.currentStatus)?.label ?? "Not set";

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr]">
        <motion.div whileHover={{ y: -3 }} className="glass relative overflow-hidden rounded-2xl p-6">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/30 to-cyan-400/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-2xl font-semibold text-white shadow-[0_0_30px_rgba(99,102,241,0.5)]">
              {initials}
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-white">{form.fullName}</div>
              <div className="mt-0.5 text-[13px] text-white/55">{profile.email}</div>
              {form.location && (
                <div className="mt-1 inline-flex items-center gap-1 text-[12px] text-white/50">
                  <MapPin className="h-3 w-3" /> {form.location}
                </div>
              )}
            </div>
          </div>
          <div className="relative mt-5 space-y-3">
            {[
              ["Career status", statusLabel],
              ["Plan", `${user?.plan ?? "free"} plan`],
              ["Profile completion", `${metrics.profileCompletion}%`],
              ["Skills", String(form.skills.length)],
              ["Active resume", summary.activeResumeTitle ?? "None"],
              ["Resume count", String(summary.resumeCount)],
              [
                "Resume uploaded",
                summary.activeResumeUploadedAt
                  ? formatResumeDate(summary.activeResumeUploadedAt)
                  : "—",
              ],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                <span className="text-[12px] text-white/50">{l}</span>
                <span className="text-[12.5px] font-medium text-white">{v}</span>
              </div>
            ))}
          </div>
          {summary.resumeCount > 0 && activeResume && (
            <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-[12px] text-white/60">
              <FileText className="h-3.5 w-3.5 text-cyan-300" />
              <span className="truncate">{activeResume.fileName}</span>
            </div>
          )}
        </motion.div>

        <div className="space-y-4">
          <Section
            title="Personal information"
            onSave={handleSave}
            saving={saving}
            saved={saved}
            error={error}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Full name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} className="sm:col-span-2" />
              <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
              <Input label="College" value={form.college} onChange={(v) => setForm({ ...form, college: v })} />
              <Input label="Degree" value={form.degree} onChange={(v) => setForm({ ...form, degree: v })} />
              <Input label="Graduation year" value={form.graduationYear} onChange={(v) => setForm({ ...form, graduationYear: v })} />
            </div>
          </Section>

          <Section title="Career information">
            <div className="grid grid-cols-2 gap-2">
              {CURRENT_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, currentStatus: opt.value })}
                  className={`rounded-xl border px-3 py-2 text-[12px] ${
                    form.currentStatus === opt.value
                      ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                      : "border-white/10 text-white/55"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <TextArea
              label="Experience"
              value={form.experience}
              onChange={(v) => setForm({ ...form, experience: v })}
            />
            <SkillsEditor
              skills={form.skills}
              input={skillInput}
              onInput={setSkillInput}
              onAdd={() => {
                const t = skillInput.trim();
                if (t && !form.skills.includes(t)) setForm({ ...form, skills: [...form.skills, t] });
                setSkillInput("");
              }}
              onRemove={(s) => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })}
            />
          </Section>

          <Section title="Career targets">
            <ListEditor
              label="Preferred roles"
              items={form.preferredRoles}
              onChange={(preferredRoles) => setForm({ ...form, preferredRoles })}
            />
            <ListEditor
              label="Preferred locations"
              items={form.preferredLocations}
              onChange={(preferredLocations) => setForm({ ...form, preferredLocations })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Employment type"
                value={form.employmentType}
                options={EMPLOYMENT_TYPE_OPTIONS}
                onChange={(employmentType) => setForm({ ...form, employmentType })}
              />
              <Select
                label="Work preference"
                value={form.workPreference}
                options={WORK_PREFERENCE_OPTIONS}
                onChange={(workPreference) => setForm({ ...form, workPreference })}
              />
            </div>
            <Input
              label="Expected salary (optional)"
              value={form.expectedSalary}
              onChange={(v) => setForm({ ...form, expectedSalary: v })}
            />
          </Section>

          <Section title="Automation preferences (stored only)">
            <Toggle
              label="Auto apply"
              checked={form.autoApply}
              onChange={(autoApply) => setForm({ ...form, autoApply })}
            />
            <Toggle
              label="Require approval"
              checked={form.requireApproval}
              onChange={(requireApproval) => setForm({ ...form, requireApproval })}
            />
            <Input
              label="Daily opportunity limit"
              value={String(form.dailyOpportunityLimit)}
              onChange={(v) =>
                setForm({ ...form, dailyOpportunityLimit: Math.max(1, Math.min(100, Number(v) || 10)) })
              }
            />
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  children,
  onSave,
  saving,
  saved,
  error,
}: {
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
  error?: string | null;
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <span className="font-display text-[15px] font-semibold text-white">{title}</span>
        </div>
        {onSave && (
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-70"
          >
            <Save className="h-3 w-3" /> {saved ? "Saved" : saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
      {error && <p className="mt-3 text-[12px] text-rose-300">{error}</p>}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1.5 w-full resize-none rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      />
    </label>
  );
}

function Select<T extends string>({
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
        className="mt-1.5 w-full rounded-xl border border-white/5 bg-[#0a0f1e] px-3 py-2 text-[13px] text-white"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SkillsEditor({
  skills,
  input,
  onInput,
  onAdd,
  onRemove,
}: {
  skills: string[];
  input: string;
  onInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (s: string) => void;
}) {
  return (
    <div>
      <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">Skills</span>
      <div className="mt-1.5 flex gap-2">
        <input
          value={input}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
          className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] text-white"
        />
        <button type="button" onClick={onAdd} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[11px] ring-1 ring-white/10">
            {s}
            <button type="button" onClick={() => onRemove(s)}>
              <X className="h-3 w-3 text-white/40" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function ListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [input, setInput] = useState("");
  return (
    <div>
      <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/45">{label}</span>
      <div className="mt-1.5 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const t = input.trim();
              if (t && !items.includes(t)) onChange([...items, t]);
              setInput("");
            }
          }}
          className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] text-white"
        />
        <button
          type="button"
          onClick={() => {
            const t = input.trim();
            if (t && !items.includes(t)) onChange([...items, t]);
            setInput("");
          }}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[11px] ring-1 ring-white/10">
            {item}
            <button type="button" onClick={() => onChange(items.filter((x) => x !== item))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 px-4 py-3">
      <span className="text-[13px] text-white/85">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full ${checked ? "bg-cyan-400/80" : "bg-white/10"}`}
      >
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
