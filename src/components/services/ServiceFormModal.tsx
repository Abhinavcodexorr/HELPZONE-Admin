"use client";

import { useState } from "react";
import { ImagePlus, Plus, X } from "lucide-react";
import type { Service, ServiceInput, SubCategory } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { keyFromName } from "@/lib/services";
import { ServiceIcon } from "./ServiceIcon";

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
  const [imageUrl, setImageUrl] = useState(service?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [subs, setSubs] = useState<SubCategory[]>(service?.subCategories ?? []);
  const [subDraft, setSubDraft] = useState("");
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = service?.key ?? presetKey ?? keyFromName(name);
  const trimmed = name.trim();
  const unchanged =
    editing &&
    trimmed === service!.name &&
    description.trim() === service!.description &&
    imageUrl === (service!.imageUrl ?? "") &&
    JSON.stringify(subs.map((s) => [s.name, s.isActive])) ===
      JSON.stringify((service!.subCategories ?? []).map((s) => [s.name, s.isActive]));

  // Adds one or several (comma-separated) sub-categories typed in the box.
  function addSubs() {
    const names = subDraft.split(",").map((n) => n.trim()).filter(Boolean);
    if (!names.length) return;
    setSubs((prev) => {
      const next = [...prev];
      names.forEach((n) => {
        if (!next.some((s) => s.name.toLowerCase() === n.toLowerCase())) next.push({ key: "", name: n.slice(0, 60), isActive: true });
      });
      return next;
    });
    setSubDraft("");
  }

  async function handleImage(file?: File) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.message || "Image upload failed");
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subDraft.trim()) {
      setError("Press Add to include the sub-category you typed, or clear it.");
      return;
    }
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
        imageUrl,
        subCategories: subs.map((s) => ({ ...(s.key && { key: s.key }), name: s.name, isActive: s.isActive })),
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
            <ServiceIcon name={service?.icon} label={name} className="h-5 w-5 text-base" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">{editing ? "Edit service" : "Add service"}</h3>
            <p className="text-sm text-muted">
              {editing ? "Changes show up in the apps right away." : "Create a category providers can offer."}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <span className="mb-2 block text-xs font-medium text-fg-2">
              Image <span className="font-normal text-subtle">(optional)</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2 ring-1 ring-border">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-5 w-5 text-subtle" />
                )}
              </span>
              <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs font-medium text-fg-2 hover:bg-surface-2">
                {uploading ? "Uploading…" : imageUrl ? "Change image" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading || saving}
                  onChange={(e) => {
                    handleImage(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl("")} className="text-xs text-danger hover:underline">
                  Remove
                </button>
              )}
            </div>
          </div>

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
            <span className="mb-1 block text-xs font-medium text-fg-2">
              Sub-categories <span className="font-normal text-subtle">(optional)</span>
            </span>
            <p className="mb-2 text-[11px] text-subtle">
              Types under this service, e.g. for AC Servicing: Window AC, Split AC. Providers can pick them.
            </p>
            {subs.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-1.5">
                {subs.map((s, i) => {
                  const inUse = (s.providerCount ?? 0) > 0;
                  return (
                    <li
                      key={`${s.key}-${i}`}
                      className={cn(
                        "flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-xs font-medium ring-1",
                        s.isActive ? "bg-primary-soft text-primary ring-primary/20" : "bg-surface-2 text-subtle line-through ring-border",
                      )}
                    >
                      <button
                        type="button"
                        title={s.isActive ? "Click to switch off" : "Click to switch on"}
                        onClick={() => setSubs((prev) => prev.map((x, n) => (n === i ? { ...x, isActive: !x.isActive } : x)))}
                      >
                        {s.name}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${s.name}`}
                        title={inUse ? `${s.providerCount} provider(s) use it — switch it off instead` : "Remove"}
                        disabled={inUse}
                        onClick={() => setSubs((prev) => prev.filter((_, n) => n !== i))}
                        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={subDraft}
                onChange={(e) => setSubDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubs();
                  }
                }}
                placeholder="e.g. Window AC, Split AC"
                maxLength={120}
              />
              <Button type="button" variant="secondary" size="sm" onClick={addSubs} disabled={!subDraft.trim()}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
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
          <Button type="submit" disabled={saving || uploading || unchanged || !trimmed}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add service"}
          </Button>
        </div>
      </form>
    </div>
  );
}
