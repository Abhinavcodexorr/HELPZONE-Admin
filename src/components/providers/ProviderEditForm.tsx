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
  const [form, setForm] = useState<Omit<UpdateProviderInput, "gender"> & { gender: "Male" | "Female" | "" }>({
    fullName: provider.fullName === "Unnamed provider" ? "" : provider.fullName,
    gender: provider.gender,
    nationality: orEmpty(provider.nationality),
    categoryIds: provider.categoryIds,
    city: orEmpty(provider.city),
    state: provider.state,
    mobileNumber: orEmpty(provider.mobileNumber),
    whatsappNumber: orEmpty(provider.whatsappNumber),
    serviceRadiusKm: provider.serviceRadiusKm,
  });
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
      await onSave({ ...form, gender: form.gender || undefined, fullName: form.fullName.trim() });
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
          <Field label="Gender">
            <select className={inputClass} value={form.gender} onChange={(e) => set("gender", e.target.value as "Male" | "Female" | "")}>
              <option value="">Not set</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </Field>
          <Field label="Nationality">
            <input className={inputClass} value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
          </Field>
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
