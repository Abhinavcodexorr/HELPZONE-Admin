"use client";

import { useState, type ReactNode } from "react";
import { Flag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { User } from "@/types";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-2 placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function Shell({ title, subtitle, icon, tone, onClose, busy, children }: { title: string; subtitle?: string; icon: ReactNode; tone: string; onClose: () => void; busy: boolean; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={busy ? undefined : onClose} />
      <div className="relative max-h-[92vh] w-full max-w-md animate-pop-in overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl">
        <button onClick={onClose} disabled={busy} aria-label="Close" className="absolute right-4 top-4 rounded-lg p-1 text-subtle hover:bg-surface-3 disabled:opacity-50">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function useSubmit(action: () => Promise<void>, fallback: string) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run() {
    setWorking(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
      setWorking(false);
    }
  }
  return { working, error, run };
}

/** Put a user on the watch list, with an optional reason. */
export function FlagUserModal({ names, onCancel, onConfirm }: { names: string[]; onCancel: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState("");
  const { working, error, run } = useSubmit(() => onConfirm(reason.trim()), "Couldn't flag. Try again.");
  return (
    <Shell title={names.length > 1 ? `Flag ${names.length} users` : "Flag user"} subtitle={names.length > 1 ? undefined : names[0]} icon={<Flag className="h-5 w-5" />} tone="bg-warning-soft text-warning" onClose={onCancel} busy={working}>
      <p className="mt-4 rounded-xl bg-surface-2 px-3.5 py-3 text-xs text-muted ring-1 ring-border">
        Flagging keeps the account working but marks it for attention. Find all flagged users with the Flagged filter.
      </p>
      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-medium text-fg-2">Why? <span className="font-normal text-subtle">(optional)</span></span>
        <textarea className={`${inputClass} resize-none`} rows={3} value={reason} onChange={(e) => setReason(e.target.value.slice(0, 300))} placeholder="e.g. Cancels most bookings at the last minute" />
      </label>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={working}>Cancel</Button>
        <Button onClick={run} disabled={working}>
          <Flag className="h-4 w-4" /> {working ? "Flagging…" : names.length > 1 ? `Flag ${names.length}` : "Flag user"}
        </Button>
      </div>
    </Shell>
  );
}

/** Fix a user's name, phone, city and address. */
export function EditUserModal({
  user,
  onCancel,
  onSave,
}: {
  user: User;
  onCancel: () => void;
  onSave: (input: { name: string; phone: string; emirate: string; address: string }) => Promise<void>;
}) {
  const orEmpty = (v: string) => (v === "—" || v === "Unnamed user" ? "" : v);
  const [name, setName] = useState(orEmpty(user.name));
  const [phone, setPhone] = useState(orEmpty(user.phone));
  const [city, setCity] = useState(orEmpty(user.city));
  const [address, setAddress] = useState(user.address);
  const { working, error, run } = useSubmit(
    () => onSave({ name: name.trim(), phone: phone.trim(), emirate: city.trim(), address: address.trim() }),
    "Couldn't save. Try again.",
  );
  return (
    <Shell title="Edit user" subtitle={user.email} icon={<span className="text-sm font-semibold">{(name || "U").charAt(0).toUpperCase()}</span>} tone="bg-primary-soft text-primary" onClose={onCancel} busy={working}>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-fg-2">Name</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-2">Phone</span>
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} inputMode="tel" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-2">City</span>
            <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-fg-2">Address</span>
          <textarea className={`${inputClass} resize-none`} rows={2} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} />
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={working}>Cancel</Button>
        <Button onClick={run} disabled={working}>{working ? "Saving…" : "Save changes"}</Button>
      </div>
    </Shell>
  );
}

/** Permanent delete, confirmed by typing DELETE. */
export function DeleteUserModal({ user, onCancel, onConfirm }: { user: User; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [typed, setTyped] = useState("");
  const { working, error, run } = useSubmit(onConfirm, "Couldn't delete. Try again.");
  return (
    <Shell title="Delete user" subtitle={user.name} icon={<Trash2 className="h-5 w-5" />} tone="bg-danger-soft text-danger" onClose={onCancel} busy={working}>
      <p className="mt-4 rounded-xl bg-danger-soft px-3.5 py-3 text-xs text-danger">
        This permanently removes the account and its booking history. It can&apos;t be undone. To only stop them using the app, block them instead.
      </p>
      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-medium text-fg-2">Type DELETE to confirm</span>
        <input className={inputClass} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" autoFocus />
      </label>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={working}>Cancel</Button>
        <Button variant="danger" onClick={run} disabled={working || typed.trim() !== "DELETE"}>
          <Trash2 className="h-4 w-4" /> {working ? "Deleting…" : "Delete user"}
        </Button>
      </div>
    </Shell>
  );
}
