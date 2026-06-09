import { useState } from "react";
import { X } from "lucide-react";
import type { OpportunityCreateInput, OpportunityType, SourceType } from "@/types/opportunity";
import { OPPORTUNITY_TYPE_OPTIONS, SOURCE_TYPE_OPTIONS } from "@/types/opportunity";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: OpportunityCreateInput) => Promise<void>;
};

const EMPTY_FORM: OpportunityCreateInput = {
  title: "",
  company: "",
  sourceType: "MANUAL",
  opportunityType: "INTERNSHIP",
  description: "",
  applyLink: "",
  location: "",
  deadline: "",
  requiredSkills: [],
};

export function AddOpportunityModal({ open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<OpportunityCreateInput>(EMPTY_FORM);
  const [skillsText, setSkillsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const update = <K extends keyof OpportunityCreateInput>(key: K, value: OpportunityCreateInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Add Opportunity</h2>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            try {
              await onSubmit({
                ...form,
                requiredSkills: skillsText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              });
              setForm(EMPTY_FORM);
              setSkillsText("");
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to create opportunity");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Field label="Title" value={form.title} onChange={(v) => update("title", v)} required />
          <Field label="Company" value={form.company} onChange={(v) => update("company", v)} required />

          <label className="block text-[11px] uppercase tracking-[0.14em] text-white/45">
            Source
            <select
              value={form.sourceType}
              onChange={(e) => update("sourceType", e.target.value as SourceType)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
            >
              {SOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[11px] uppercase tracking-[0.14em] text-white/45">
            Type
            <select
              value={form.opportunityType}
              onChange={(e) => update("opportunityType", e.target.value as OpportunityType)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
            >
              {OPPORTUNITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[11px] uppercase tracking-[0.14em] text-white/45">
            Description
            <textarea
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
            />
          </label>

          <Field label="Apply Link" value={form.applyLink ?? ""} onChange={(v) => update("applyLink", v)} />
          <Field label="Location" value={form.location ?? ""} onChange={(v) => update("location", v)} />

          <label className="block text-[11px] uppercase tracking-[0.14em] text-white/45">
            Deadline
            <input
              type="datetime-local"
              value={form.deadline ?? ""}
              onChange={(e) => update("deadline", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="block text-[11px] uppercase tracking-[0.14em] text-white/45">
            Required Skills (comma-separated)
            <input
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="React, TypeScript, Git"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </label>

          {error && <p className="text-[12px] text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Saving…" : "Add Opportunity"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-[11px] uppercase tracking-[0.14em] text-white/45">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
      />
    </label>
  );
}
