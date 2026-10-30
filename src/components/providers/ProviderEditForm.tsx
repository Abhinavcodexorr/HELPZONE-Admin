"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Radar } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { labelForCategory } from "@/lib/map-provider";
import { cn } from "@/lib/utils";
import type { Provider, Service, UpdateProviderInput } from "@/types";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-2 placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

/** How far the provider will travel for work. `null` = not set. */
const RADIUS_OPTIONS: (number | null)[] = [null, 5, 10, 15, 25, 50];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-fg-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-subtle">{hint}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface p-5 ring-1 ring-border">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function ProviderEditForm({
  provider,
  services,
  backHref,
  onSave,
}: {
  provider: Provider;
  services: Service[];
  backHref: string;
  onSave: (input: UpdateProviderInput) => Promise<void>;
}) {
  const orEmpty = (v: string) => (v === "—" ? "" : v);
  const [form, setForm] = useState<UpdateProviderInput>({
    fullName: provider.fullName === "Unnamed provider" ? "" : provider.fullName,
    categoryIds: provider.categoryIds,
    city: orEmpty(provider.city),
    state: provider.state,
    area: provider.area,
    pincode: provider.pincode,
    mobileNumber: orEmpty(provider.mobileNumber),
    whatsappNumber: orEmpty(provider.whatsappNumber),
    serviceRadiusKm: provider.serviceRadiusKm,
    experienceYears: provider.experienceYears,
    monthlySalary: provider.monthlySalary ?? null,
    duration: provider.duration,
    languages: provider.languages,
    skills: provider.skills,
    jobDescription: provider.jobDescription,
    lastWorkingExperience: {
      jobTitle: provider.lastJob?.jobTitle ?? "",
      duration: provider.lastJob?.duration ?? "",
      workingCity: provider.lastJob?.workingCity ?? "",
      familySize: provider.lastJob?.familySize ?? "",
      salary: provider.lastJob?.salary ?? null,
      reasonForLeaving: provider.lastJob?.reasonForLeaving ?? "",
    },
  });
  // Languages and skills are typed as comma-separated text.
  const [languagesText, setLanguagesText] = useState(provider.languages.join(", "));
  const [skillsText, setSkillsText] = useState(provider.skills.join(", "));
  const setJob = <K extends keyof UpdateProviderInput["lastWorkingExperience"]>(key: K, value: UpdateProviderInput["lastWorkingExperience"][K]) =>
    setForm((f) => ({ ...f, lastWorkingExperience: { ...f.lastWorkingExperience, [key]: value } }));
  const numberOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
  const list = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Services from the catalog, plus any key this provider already has that isn't in it.
  const known = new Set(services.map((s) => s.key));
  const options = [
    ...services.map((s) => ({ key: s.key, name: s.name })),
    ...form.categoryIds.filter((k) => !known.has(k)).map((k) => ({ key: k, name: labelForCategory(k) })),
  ];
  const radii = RADIUS_OPTIONS.includes(provider.serviceRadiusKm) ? RADIUS_OPTIONS : [...RADIUS_OPTIONS, provider.serviceRadiusKm];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Enter the provider's name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form, fullName: form.fullName.trim(), languages: list(languagesText), skills: list(skillsText) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl space-y-4">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to details
      </Link>

      <div className="flex items-center gap-3.5">
        <Avatar name={provider.fullName} color={provider.avatarColor} size={52} />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-foreground">Edit provider</h1>
          <p className="truncate text-sm text-muted">{provider.fullName}</p>
        </div>
      </div>

      <Section title="Personal details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Full name">
              <input className={inputClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Contact & location">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mobile number">
            <input className={inputClass} value={form.mobileNumber} onChange={(e) => set("mobileNumber", e.target.value)} inputMode="tel" />
          </Field>
          <Field label="WhatsApp number">
            <input className={inputClass} value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} inputMode="tel" />
          </Field>
          <Field label="City">
            <input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Area">
            <input className={inputClass} value={form.area} onChange={(e) => set("area", e.target.value)} />
          </Field>
          <Field label="Pincode">
            <input className={inputClass} value={form.pincode} onChange={(e) => set("pincode", e.target.value)} inputMode="numeric" maxLength={10} />
          </Field>
          <Field label="State">
            <input className={inputClass} value={form.state} onChange={(e) => set("state", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Services">
        {options.length === 0 ? (
          <p className="text-sm text-subtle">No services yet. Add some under Services first.</p>
        ) : (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Services">
            {options.map((o) => {
              const on = form.categoryIds.includes(o.key);
              return (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("categoryIds", on ? form.categoryIds.filter((k) => k !== o.key) : [...form.categoryIds, o.key])}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition active:scale-95",
                    on ? "bg-primary text-primary-foreground ring-primary" : "bg-surface text-fg-2 ring-border hover:bg-surface-2",
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {o.name}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Work & experience">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Experience (years)">
            <input type="number" min={0} className={inputClass} value={form.experienceYears ?? ""} onChange={(e) => set("experienceYears", numberOrNull(e.target.value))} />
          </Field>
          <Field label="Expected monthly salary (₹)">
            <input type="number" min={0} className={inputClass} value={form.monthlySalary ?? ""} onChange={(e) => set("monthlySalary", numberOrNull(e.target.value))} />
          </Field>
          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-fg-2">Job type</span>
            <div role="radiogroup" aria-label="Job type" className="flex flex-wrap gap-2">
              {["", "Part-time", "Full-time", "Flexible"].map((t) => {
                const on = form.duration === t;
                return (
                  <button
                    key={t || "none"}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set("duration", t)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition active:scale-95",
                      on ? "bg-primary-soft text-primary ring-2 ring-primary" : "bg-surface text-fg-2 ring-border hover:bg-surface-2",
                    )}
                  >
                    {t || "Not set"}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Languages" hint="Separate with commas, e.g. Hindi, Gujarati, English">
            <input className={inputClass} value={languagesText} onChange={(e) => setLanguagesText(e.target.value)} />
          </Field>
          <Field label="Skills" hint="Separate with commas">
            <input className={inputClass} value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="About their work">
              <textarea className={`${inputClass} resize-none`} rows={3} maxLength={2000} value={form.jobDescription} onChange={(e) => set("jobDescription", e.target.value)} />
            </Field>
          </div>
        </div>

        <p className="mb-3 mt-5 text-[11px] font-semibold uppercase tracking-wide text-subtle">Previous job</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title">
            <input className={inputClass} value={form.lastWorkingExperience.jobTitle} onChange={(e) => setJob("jobTitle", e.target.value)} />
          </Field>
          <Field label="Duration" hint="e.g. 3 years">
            <input className={inputClass} value={form.lastWorkingExperience.duration} onChange={(e) => setJob("duration", e.target.value)} />
          </Field>
          <Field label="Work city">
            <input className={inputClass} value={form.lastWorkingExperience.workingCity} onChange={(e) => setJob("workingCity", e.target.value)} />
          </Field>
          <Field label="Family size">
            <input className={inputClass} value={form.lastWorkingExperience.familySize} onChange={(e) => setJob("familySize", e.target.value)} />
          </Field>
          <Field label="Salary (₹ / month)">
            <input type="number" min={0} className={inputClass} value={form.lastWorkingExperience.salary ?? ""} onChange={(e) => setJob("salary", numberOrNull(e.target.value))} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Reason for leaving">
              <input className={inputClass} value={form.lastWorkingExperience.reasonForLeaving} onChange={(e) => setJob("reasonForLeaving", e.target.value)} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Service radius">
        <p className="mb-3 flex items-start gap-2 text-xs text-muted">
          <Radar className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          How far from their city this provider will travel. They are matched to customers and requests within this distance.
        </p>
        <div role="radiogroup" aria-label="Service radius" className="flex flex-wrap gap-2">
          {radii.map((km) => {
            const on = form.serviceRadiusKm === km;
            return (
              <button
                key={km ?? "none"}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set("serviceRadiusKm", km)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition active:scale-95",
                  on ? "bg-primary-soft text-primary ring-2 ring-primary" : "bg-surface text-fg-2 ring-border hover:bg-surface-2",
                )}
              >
                <span className={cn("flex h-4 w-4 items-center justify-center rounded-full ring-2", on ? "ring-primary" : "ring-border")}>
                  {on && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                {km === null ? "Not set" : `${km} km`}
              </button>
            );
          })}
        </div>
      </Section>

      {error && <p className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">{error}</p>}

      <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 bg-background/90 px-1 py-3 backdrop-blur">
        <Link href={backHref}>
          <Button type="button" variant="secondary" disabled={saving}>
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
