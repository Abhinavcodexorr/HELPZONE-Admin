"use client";

import { useState } from "react";
import { Provider, UpdateProviderInput } from "@/types";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function EditProviderModal({
  provider,
  onClose,
  onSave,
}: {
  provider: Provider;
  onClose: () => void;
  onSave: (id: string, input: UpdateProviderInput) => Promise<void>;
}) {
  const [form, setForm] = useState<UpdateProviderInput>({
    fullName: provider.fullName,
    gender: provider.gender,
    nationality: provider.nationality,
    categoryId: provider.categoryId,
    area: provider.area,
    city: provider.city,
    mobileNumber: provider.mobileNumber,
    whatsappNumber: provider.whatsappNumber,
    email: provider.email,
    experienceYears: provider.experienceYears,
    kyc: { idType: provider.kyc.idType, idNumber: provider.kyc.idNumber },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof UpdateProviderInput>(key: K, value: UpdateProviderInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(provider.id, form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={saving ? undefined : onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-base font-semibold text-gray-900">Edit provider</h3>
        <p className="mt-1 text-sm text-gray-500">{provider.id}</p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Full name">
              <input
                className={inputClass}
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Gender">
            <select
              className={inputClass}
              value={form.gender}
              onChange={(e) => set("gender", e.target.value as "Male" | "Female")}
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </Field>
          <Field label="Nationality">
            <input
              className={inputClass}
              value={form.nationality}
              onChange={(e) => set("nationality", e.target.value)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Category">
              <input
                className={inputClass}
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                placeholder="e.g. cat-cook"
              />
            </Field>
          </div>

          <Field label="Area">
            <input className={inputClass} value={form.area} onChange={(e) => set("area", e.target.value)} />
          </Field>
          <Field label="City">
            <input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>

          <Field label="Mobile number">
            <input
              className={inputClass}
              value={form.mobileNumber}
              onChange={(e) => set("mobileNumber", e.target.value)}
            />
          </Field>
          <Field label="WhatsApp number">
            <input
              className={inputClass}
              value={form.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Experience (years)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.experienceYears}
              onChange={(e) => set("experienceYears", Number(e.target.value))}
            />
          </Field>
          <Field label="ID type">
            <input
              className={inputClass}
              value={form.kyc.idType}
              onChange={(e) => set("kyc", { ...form.kyc, idType: e.target.value })}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="ID number">
              <input
                className={inputClass}
                value={form.kyc.idNumber}
                onChange={(e) => set("kyc", { ...form.kyc, idNumber: e.target.value })}
              />
            </Field>
          </div>
        </div>

        {error && <p className="mt-4 text-xs text-rose-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
