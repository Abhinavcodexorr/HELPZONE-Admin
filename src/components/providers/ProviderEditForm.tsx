"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Check, History, MapPin, Radar, User, Wrench, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { labelForCategory } from "@/lib/map-provider";
import { cn } from "@/lib/utils";
import type { Provider, Service, UpdateProviderInput } from "@/types";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-2 placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

/** How far the provider will travel for work. `null` = not set. */
/** Same choices as the provider app's "Work preferences" step. */
const LANGUAGES = ["Hindi", "English", "Punjabi", "Bengali", "Marathi", "Tamil", "Telugu", "Gujarati", "Kannada"];
const JOB_TYPES = ["Full-time", "Part-time"];
const EDUCATION = [
  "No formal education",
  "Primary school",
  "Middle school",
  "Secondary (10th pass)",
  "Higher secondary (12th pass)",
  "Diploma / ITI",
  "Graduate",
  "Post graduate",
];

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

function Section({
  icon: Icon,
  title,
  hint,
  tone = "bg-primary-soft text-primary",
  highlight = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  tone?: string;
  /** Warm accent, used for the previous-job block. */
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl ring-1",
        highlight ? "bg-gradient-to-br from-amber-50 via-surface to-surface ring-2 ring-amber-300/70 dark:from-amber-400/10 dark:ring-amber-400/40" : "bg-surface ring-border",
      )}
    >
      <header className={cn("flex items-center gap-3 px-5 py-3.5", highlight ? "bg-amber-100/70 dark:bg-amber-400/15" : "border-b border-border")}>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", highlight ? "bg-amber-400 text-amber-950 shadow-sm" : tone)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2 className={cn("text-sm font-semibold", highlight ? "font-bold text-amber-950 dark:text-amber-200" : "text-foreground")}>{title}</h2>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
      </header>
      <div className="p-5">{children}</div>
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
    education: provider.education,
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
  const setJob = <K extends keyof UpdateProviderInput["lastWorkingExperience"]>(key: K, value: UpdateProviderInput["lastWorkingExperience"][K]) =>
    setForm((f) => ({ ...f, lastWorkingExperience: { ...f.lastWorkingExperience, [key]: value } }));
  const numberOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
  const toggleLanguage = (l: string) =>
    setForm((f) => ({ ...f, languages: f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l] }));
  // Keep a language or education value the provider already has even if it is not one of the standard choices.
  const languageChoices = [...LANGUAGES, ...form.languages.filter((l) => !LANGUAGES.includes(l))];
  const educationChoices = form.education && !EDUCATION.includes(form.education) ? [form.education, ...EDUCATION] : EDUCATION;
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
      await onSave({ ...form, fullName: form.fullName.trim() });
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

      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-primary/15 via-accent/10 to-info/10 p-5 ring-1 ring-border">
        {provider.kyc.photoImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={provider.kyc.photoImage} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-4 ring-surface" />
        ) : (
          <span className="rounded-2xl ring-4 ring-surface">
            <Avatar name={provider.fullName} color={provider.avatarColor} size={64} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Editing provider</p>
          <h1 className="truncate text-xl font-bold text-foreground">{provider.fullName}</h1>
        </div>
      </div>

      <Section icon={User} title="Name" hint="How this provider appears across the panel">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Full name">
              <input className={inputClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
            </Field>
          </div>
        </div>
      </Section>

      <Section icon={MapPin} title="Contact & location" hint="Where to reach them and where they work" tone="bg-success-soft text-success">
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

      <Section icon={Wrench} title="Services" hint="What they offer. Tap to switch on or off" tone="bg-accent-soft text-accent">
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

      <Section icon={Briefcase} title="Work preferences" hint="Experience, pay expectation, languages and education" tone="bg-info-soft text-info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Years of experience">
            <div className="relative">
              <input type="number" min={0} className={`${inputClass} pr-16`} value={form.experienceYears ?? ""} onChange={(e) => set("experienceYears", numberOrNull(e.target.value))} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subtle">years</span>
            </div>
          </Field>
          <Field label="Expected salary">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fg-2">₹</span>
              <input type="number" min={0} className={`${inputClass} pl-7 pr-16`} value={form.monthlySalary ?? ""} onChange={(e) => set("monthlySalary", numberOrNull(e.target.value))} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subtle">/ month</span>
            </div>
          </Field>

          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-fg-2">Duration</span>
            <div role="radiogroup" aria-label="Duration" className="grid grid-cols-2 gap-2">
              {JOB_TYPES.map((t) => {
                const on = form.duration === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set("duration", on ? "" : t)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition active:scale-95",
                      on ? "bg-primary-soft text-primary ring-2 ring-primary" : "bg-surface text-fg-2 ring-border hover:bg-surface-2",
                    )}
                  >
                    {on && <Check className="h-4 w-4" />}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-fg-2">Languages</span>
            <div role="group" aria-label="Languages" className="flex flex-wrap gap-2">
              {languageChoices.map((l) => {
                const on = form.languages.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleLanguage(l)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition active:scale-95",
                      on ? "bg-primary-soft text-primary ring-primary" : "bg-surface text-fg-2 ring-border hover:bg-surface-2",
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" />}
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sm:col-span-2">
            <Field label="Education">
              <select className={inputClass} value={form.education} onChange={(e) => set("education", e.target.value)}>
                <option value="">Not set</option>
                {educationChoices.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Section>

      <Section icon={History} title="Last job" hint="Their most recent work experience" highlight>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title">
            <input className={inputClass} placeholder="e.g. Live-in Babysitter" value={form.lastWorkingExperience.jobTitle} onChange={(e) => setJob("jobTitle", e.target.value)} />
          </Field>
          <Field label="Working city">
            <input className={inputClass} value={form.lastWorkingExperience.workingCity} onChange={(e) => setJob("workingCity", e.target.value)} />
          </Field>
          <Field label="Size of family">
            <div className="relative">
              <input type="number" min={0} className={`${inputClass} pr-20`} value={form.lastWorkingExperience.familySize} onChange={(e) => setJob("familySize", e.target.value)} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subtle">members</span>
            </div>
          </Field>
          <Field label="Duration">
            <input className={inputClass} placeholder="e.g. 3 years" value={form.lastWorkingExperience.duration} onChange={(e) => setJob("duration", e.target.value)} />
          </Field>
          <Field label="Salary">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fg-2">₹</span>
              <input type="number" min={0} className={`${inputClass} pl-7 pr-12`} value={form.lastWorkingExperience.salary ?? ""} onChange={(e) => setJob("salary", numberOrNull(e.target.value))} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subtle">/ mo</span>
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Reason for leaving">
              <textarea className={`${inputClass} resize-none`} rows={2} placeholder="e.g. Family relocated to another city" value={form.lastWorkingExperience.reasonForLeaving} onChange={(e) => setJob("reasonForLeaving", e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Job description">
              <textarea className={`${inputClass} resize-none`} rows={3} maxLength={2000} placeholder="e.g. Cared for two children, prepared meals…" value={form.jobDescription} onChange={(e) => set("jobDescription", e.target.value)} />
            </Field>
          </div>
        </div>
      </Section>

      <Section icon={Radar} title="Service radius" hint="How far they will travel for work" tone="bg-warning-soft text-warning">
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

      <div className="sticky bottom-3 z-20 flex items-center justify-end gap-2 rounded-2xl bg-surface/95 px-4 py-3 shadow-lg ring-1 ring-border backdrop-blur">
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
