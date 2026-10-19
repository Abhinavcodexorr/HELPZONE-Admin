"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Service, ServiceInput } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { keyFromName } from "@/lib/services";
import { ServiceIcon, serviceIconOptions } from "./ServiceIcon";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-2 placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const MAX_DESCRIPTION = 300;

/** Create (no `service`) or edit (with `service`). `presetKey` locks the key when adding a detected category. */
export function ServiceFormModal({
  service,
  presetKey,
  presetName,
  onClose,
  onSubmit,
}: {
  service?: Service;
  presetKey?: string;
  presetName?: string;
  onClose: () => void;
  onSubmit: (input: ServiceInput) => Promise<void>;
}) {
  const editing = Boolean(service);
  const [name, setName] = useState(service?.name ?? presetName ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [icon, setIcon] = useState(service?.icon ?? "");
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = service?.key ?? presetKey ?? keyFromName(name);
  const trimmed = name.trim();
  const unchanged =
    editing && trimmed === service!.name && description.trim() === service!.description && icon === service!.icon;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (trimmed.length < 2) {
      setError("Enter a service name (at least 2 characters).");
      return;
    }
    if (!key) {
      setError("The name needs at least one letter or number.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: trimmed,
        description: description.trim(),
        icon,
        ...(editing ? {} : { isActive, ...(presetKey && { key: presetKey }) }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service");
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
            <ServiceIcon name={icon} label={name} className="h-5 w-5 text-base" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">{editing ? "Edit service" : "Add service"}</h3>
            <p className="text-sm text-muted">
              {editing ? "Changes show up in the apps right away." : "Create a category providers can offer."}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-2">Service name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cook"
              maxLength={60}
              autoFocus
              required
            />
          </label>

          <div>
            <span className="mb-1 block text-xs font-medium text-fg-2">Key</span>
            <p className="rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs text-muted ring-1 ring-border">
              {key || "cat-…"}
            </p>
            <p className="mt-1 text-[11px] text-subtle">
              {editing || presetKey
                ? "Providers are linked to this key, so it can't be changed."
                : "Generated from the name. Providers are linked to it, so it can't be changed later."}
            </p>
          </div>

          <label className="block">
            <span className="mb-1 flex items-center justify-between text-xs font-medium text-fg-2">
              Description
              <span className="font-normal text-subtle">
                {description.length}/{MAX_DESCRIPTION}
              </span>
            </span>
            <textarea
              className={cn(inputClass, "resize-none")}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESCRIPTION}
              placeholder="What this service covers"
            />
          </label>

          <div>
            <span className="mb-2 block text-xs font-medium text-fg-2">
              Icon <span className="font-normal text-subtle">(optional · tap again to remove)</span>
            </span>
            <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Icon">
              {serviceIconOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={icon === value}
                  aria-label={label}
                  title={label}
                  onClick={() => setIcon(icon === value ? "" : value)}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-lg ring-1 transition active:scale-90",
                    icon === value
                      ? "bg-primary-soft text-primary ring-2 ring-primary"
                      : "bg-surface text-muted ring-border hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  <ServiceIcon name={value} className="h-[18px] w-[18px]" />
                </button>
              ))}
            </div>
          </div>

          {!editing && (
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-surface-2 px-3.5 py-3 ring-1 ring-border">
              <span>
                <span className="block text-sm font-medium text-foreground">Active</span>
                <span className="block text-xs text-muted">Inactive services are hidden from the apps.</span>
              </span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
            </label>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || unchanged || !trimmed}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add service"}
          </Button>
        </div>
      </form>
    </div>
  );
}
