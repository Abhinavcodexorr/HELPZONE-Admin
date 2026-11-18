"use client";

import { useState } from "react";
import { Check, Pencil, Plus, ShieldCheck, Trash2, UserCog, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { flagEmoji, type Country } from "@/lib/countries";
import { cn, formatDate } from "@/lib/utils";

export interface AdminRow {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "subadmin";
  countries: string[];
  isActive: boolean;
  lastLoginAt: string | null;
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-2 placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

async function call(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...init });
  const body = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; data?: unknown };
  if (!res.ok || body.success === false) throw new Error(body.message || "Something went wrong");
  return body.data;
}

const json = (method: string, payload: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

export function AdminsManager({ initial, countries, meId }: { initial: AdminRow[]; countries: Country[]; meId: string | null }) {
  const [admins, setAdmins] = useState(initial);
  const [editing, setEditing] = useState<AdminRow | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const nameOf = (code: string) => countries.find((c) => c.code === code)?.name ?? code;

  async function toggleActive(admin: AdminRow) {
    setBusyId(admin.id);
    setError(null);
    try {
      const updated = (await call(`/api/admins/${admin.id}`, json("PATCH", { isActive: !admin.isActive }))) as AdminRow;
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updated : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the admin.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(admin: AdminRow) {
    if (!window.confirm(`Delete ${admin.name}? They will be signed out and lose access.`)) return;
    setBusyId(admin.id);
    setError(null);
    try {
      await call(`/api/admins/${admin.id}`, { method: "DELETE" });
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete the admin.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        icon={UserCog}
        title="Admins"
        description="Who can sign in, and which countries each person can work in"
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" /> Add admin
          </Button>
        }
      />

      <Card className="mb-5 p-4">
        <p className="text-sm text-fg-2">
          <b>Superadmin</b> can use every country and manage admins. <b>Subadmin</b> can only use the countries you tick. With one country, they go straight in after sign-in; with several, they choose one.
        </p>
      </Card>

      {error && <div className="mb-4 rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">{error}</div>}

      {admins.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">No other admins yet. Your own account signs in from the server settings; add subadmins here.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {admins.map((a) => (
            <Card key={a.id} className={cn("flex flex-col p-5", !a.isActive && "opacity-70")}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">{a.name.charAt(0).toUpperCase()}</span>
                <Badge tone={a.role === "superadmin" ? "indigo" : "blue"}>
                  {a.role === "superadmin" && <ShieldCheck className="h-3 w-3" />} {a.role === "superadmin" ? "Superadmin" : "Subadmin"}
                </Badge>
              </div>
              <h3 className="mt-3 truncate text-base font-semibold text-foreground">{a.name}</h3>
              <p className="truncate text-sm text-muted">{a.email}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.role === "superadmin" ? (
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-fg-2 ring-1 ring-border">All countries</span>
                ) : (
                  a.countries.map((c) => (
                    <span key={c} className="flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                      {flagEmoji(c)} {nameOf(c)}
                    </span>
                  ))
                )}
              </div>
              <p className="mt-3 text-[11px] text-muted">{a.lastLoginAt ? `Last sign-in ${formatDate(a.lastLoginAt)}` : "Never signed in"}</p>

              <div className="flex-1" />
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <button
                  type="button"
                  role="switch"
                  aria-checked={a.isActive}
                  aria-label={a.isActive ? `Disable ${a.name}` : `Enable ${a.name}`}
                  disabled={busyId === a.id || a.id === meId}
                  onClick={() => toggleActive(a)}
                  className="flex items-center gap-2.5 text-xs font-medium text-fg-2 disabled:opacity-60"
                >
                  <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", a.isActive ? "bg-success-solid" : "bg-border")}>
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", a.isActive ? "translate-x-[22px]" : "translate-x-0.5")} />
                  </span>
                  {a.isActive ? "Active" : "Disabled"}
                </button>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditing(a)} aria-label={`Edit ${a.name}`} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-3 hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(a)} disabled={busyId === a.id || a.id === meId} aria-label={`Delete ${a.name}`} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <AdminForm
          admin={editing === "new" ? null : editing}
          countries={countries}
          isMe={editing !== "new" && editing.id === meId}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setAdmins((prev) => (prev.some((a) => a.id === saved.id) ? prev.map((a) => (a.id === saved.id ? saved : a)) : [...prev, saved]));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function AdminForm({
  admin,
  countries,
  isMe,
  onClose,
  onSaved,
}: {
  admin: AdminRow | null;
  countries: Country[];
  isMe: boolean;
  onClose: () => void;
  onSaved: (admin: AdminRow) => void;
}) {
  const [name, setName] = useState(admin?.name ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"superadmin" | "subadmin">(admin?.role ?? "subadmin");
  const [picked, setPicked] = useState<string[]>(admin?.countries ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter a name.");
    if (!admin && !email.trim()) return setError("Enter an email.");
    if (!admin && password.length < 8) return setError("Password must be at least 8 characters.");
    if (admin && password && password.length < 8) return setError("Password must be at least 8 characters.");
    if (role === "subadmin" && picked.length === 0) return setError("Choose at least one country.");
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), role, countries: role === "subadmin" ? picked : [], ...(password && { password }), ...(!admin && { email: email.trim() }) };
      const saved = (await call(admin ? `/api/admins/${admin.id}` : "/api/admins", json(admin ? "PATCH" : "POST", payload))) as AdminRow;
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={saving ? undefined : onClose} />
      <form onSubmit={submit} className="relative max-h-[92vh] w-full max-w-md animate-pop-in overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl">
        <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="absolute right-4 top-4 rounded-lg p-1 text-subtle hover:bg-surface-3">
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-base font-semibold text-foreground">{admin ? "Edit admin" : "Add admin"}</h3>
        <p className="text-sm text-muted">{admin ? admin.email : "They sign in with this email and password."}</p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-2">Name</span>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus />
          </label>
          {!admin && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-fg-2">Email</span>
              <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-2">{admin ? "New password (leave empty to keep)" : "Password"}</span>
            <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-fg-2">Role</span>
            <div role="radiogroup" aria-label="Role" className="grid grid-cols-2 gap-2">
              {(["subadmin", "superadmin"] as const).map((r) => {
                const on = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={isMe && r === "subadmin"}
                    onClick={() => setRole(r)}
                    className={cn("rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition active:scale-95 disabled:opacity-50", on ? "bg-primary-soft text-primary ring-2 ring-primary" : "bg-surface text-fg-2 ring-border hover:bg-surface-2")}
                  >
                    {r === "superadmin" ? "Superadmin" : "Subadmin"}
                  </button>
                );
              })}
            </div>
          </div>

          {role === "subadmin" ? (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-fg-2">Countries they can work in</span>
              <div className="space-y-2">
                {countries.map((c) => {
                  const on = picked.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPicked((p) => (p.includes(c.code) ? p.filter((x) => x !== c.code) : [...p, c.code]))}
                      className={cn("flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left ring-1 transition active:scale-[0.99]", on ? "bg-primary-soft ring-2 ring-primary" : "bg-surface ring-border hover:bg-surface-2")}
                    >
                      <span className="text-xl">{flagEmoji(c.code)}</span>
                      <span className="flex-1 text-sm font-semibold text-foreground">{c.name}</span>
                      {on && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-subtle">{picked.length === 1 ? "With one country they go straight in after sign-in." : "With several, they choose one after sign-in."}</p>
            </div>
          ) : (
            <p className="rounded-xl bg-surface-2 px-3.5 py-3 text-xs text-muted ring-1 ring-border">A superadmin can use every country and manage admins.</p>
          )}
        </div>

        {error && <p className="mt-4 text-xs text-danger">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : admin ? "Save changes" : "Add admin"}
          </Button>
        </div>
      </form>
    </div>
  );
}
