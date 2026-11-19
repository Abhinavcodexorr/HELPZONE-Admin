"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Pencil, Plus, ShieldCheck, Trash2, UserCog, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { flagEmoji, type Country } from "@/lib/countries";
import { cn, formatDate } from "@/lib/utils";
import { call, json, type AdminRow, type Rbac } from "./admin-shared";

export type { AdminRow, Rbac };

export function AdminsManager({ initial, countries, meId, rbac }: { initial: AdminRow[]; countries: Country[]; meId: string | null; rbac: Rbac }) {
  const [admins, setAdmins] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminRow | null>(null);
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
    await call(`/api/admins/${admin.id}`, { method: "DELETE" });
    setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    setDeleting(null);
  }

  return (
    <div>
      <PageHeader
        icon={UserCog}
        title="Admins"
        description="Who can sign in, and which countries each person can work in"
        actions={
          <Link href="/admins/new">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> Add admin
            </Button>
          </Link>
        }
      />

      <Card className="mb-5 p-4">
        <p className="text-sm text-fg-2">
          <b>Superadmin</b> can use every country, do everything and manage admins. <b>Subadmin</b> can only use the countries you tick and only do what their role allows. With one country, they go straight in after sign-in; with several, they choose one. Everything they do is recorded in the Audit log.
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
              {a.role === "subadmin" && (
                <p className="mt-3 text-xs text-fg-2">
                  <b>{rbac.templates.find((t) => t.key === a.roleTemplate)?.label ?? "Custom"}</b> · {a.permissions.length} permission{a.permissions.length === 1 ? "" : "s"}
                </p>
              )}
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
                    <span className={cn("absolute left-0 top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform", a.isActive ? "translate-x-[22px]" : "translate-x-0.5")} />
                  </span>
                  {a.isActive ? "Active" : "Disabled"}
                </button>
                <div className="flex items-center gap-1">
                  <Link href={`/admins/${a.id}/edit`} aria-label={`Edit ${a.name}`} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-3 hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button type="button" onClick={() => setDeleting(a)} disabled={busyId === a.id || a.id === meId} aria-label={`Delete ${a.name}`} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {deleting && <DeleteAdminModal admin={deleting} onCancel={() => setDeleting(null)} onConfirm={() => remove(deleting)} />}

    </div>
  );
}

function DeleteAdminModal({ admin, onCancel, onConfirm }: { admin: AdminRow; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setWorking(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete the admin.");
      setWorking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={working ? undefined : onCancel} />
      <div className="relative w-full max-w-sm animate-pop-in rounded-2xl bg-surface p-6 shadow-xl">
        <button onClick={onCancel} disabled={working} aria-label="Close" className="absolute right-4 top-4 rounded-lg p-1 text-subtle hover:bg-surface-3 disabled:opacity-50">
          <X className="h-4 w-4" />
        </button>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-base font-semibold text-foreground">Delete this admin?</h3>
        <p className="mt-1 text-sm text-muted">
          <span className="font-medium text-fg-2">{admin.name}</span> ({admin.email}) will be signed out and lose access right away. Their past activity stays in the audit log. This can&apos;t be undone.
        </p>
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={working}>
            Cancel
          </Button>
          <Button variant="danger" onClick={run} disabled={working}>
            {working ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
