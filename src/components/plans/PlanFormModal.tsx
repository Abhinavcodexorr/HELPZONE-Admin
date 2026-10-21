"use client";

import { useState } from "react";
import { Award, X } from "lucide-react";
import type { Plan, PlanInput } from "@/types";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-2 placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

/** Create (no `plan`) or edit (with `plan`). */
export function PlanFormModal({
  plan,
  onClose,
  onSubmit,
}: {
  plan?: Plan;
  onClose: () => void;
  onSubmit: (input: PlanInput) => Promise<void>;
}) {
  const editing = Boolean(plan);
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [price, setPrice] = useState(plan ? String(plan.price) : "");
  const [originalPrice, setOriginalPrice] = useState(plan?.originalPrice ? String(plan.originalPrice) : "");
  const [durationDays, setDurationDays] = useState(plan ? String(plan.durationDays) : "30");
  const [features, setFeatures] = useState((plan?.features ?? []).join("\n"));
  const [isPopular, setIsPopular] = useState(plan?.isPopular ?? false);
  const [sortOrder, setSortOrder] = useState(plan ? String(plan.sortOrder) : "0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Enter a plan name (at least 2 characters).");
      return;
    }
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum < 0) {
      setError("Enter a valid, non-negative price.");
      return;
    }
    const durationNum = Number(durationDays);
    if (!durationDays || Number.isNaN(durationNum) || durationNum < 1) {
      setError("Enter a duration of at least 1 day.");
      return;
    }
    const originalNum = originalPrice ? Number(originalPrice) : undefined;
    if (originalPrice && (Number.isNaN(originalNum) || (originalNum as number) <= priceNum)) {
      setError("Original price must be greater than the price (it's shown struck through).");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim(),
        price: priceNum,
        originalPrice: originalNum,
        durationDays: durationNum,
        features: features.split("\n").map((f) => f.trim()).filter(Boolean),
        isPopular,
        sortOrder: Number(sortOrder) || 0,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={saving ? undefined : onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative max-h-[92vh] w-full max-w-lg animate-pop-in overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1 text-subtle hover:bg-surface-3 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">{editing ? "Edit plan" : "Add plan"}</h3>
            <p className="text-sm text-muted">
              {editing ? "Changes show up on the pricing page right away." : "Create a membership tier for the pricing page."}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-2">Plan name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard"
              maxLength={60}
              autoFocus
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-2">Description</span>
            <input
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shown under the plan name"
              maxLength={200}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-2">Price (₹)</span>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="999"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-2">
                Original price <span className="font-normal text-subtle">(optional)</span>
              </span>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="1499"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-2">Duration (days)</span>
              <input
                className={inputClass}
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-2">
                Sort order <span className="font-normal text-subtle">(lower = first)</span>
              </span>
              <input
                className={inputClass}
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-2">
              Features <span className="font-normal text-subtle">(one per line)</span>
            </span>
            <textarea
              className={cn(inputClass, "resize-none")}
              rows={4}
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder={"Unlock price & phone for every provider\nValid for 30 days\nPriority support"}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-fg-2">
            <input
              type="checkbox"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            Mark as &quot;Most Popular&quot;
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-fg-2 hover:bg-surface-3 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Create plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
