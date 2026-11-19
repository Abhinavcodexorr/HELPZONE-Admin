"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, UserCog } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { flagEmoji, type Country } from "@/lib/countries";
import { cn } from "@/lib/utils";
import type { RbacPermission } from "@/lib/permissions";
import { call, inputClass, json, type AdminRow, type Rbac } from "./admin-shared";

export function AdminForm({
  admin,
  countries,
  rbac,
  isMe,
}: {
  admin: AdminRow | null;
  countries: Country[];
  rbac: Rbac;
  isMe: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(admin?.name ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"superadmin" | "subadmin">(admin?.role ?? "subadmin");
  const [picked, setPicked] = useState<string[]>(admin?.countries ?? []);
  // Ready-made role, or "custom" to tick each permission.
  const [template, setTemplate] = useState<string>(admin?.role === "subadmin" ? admin.roleTemplate || "manager" : "manager");
  const [perms, setPerms] = useState<string[]>(admin?.role === "subadmin" ? admin.permissions : rbac.templates.find((t) => t.key === "manager")?.permissions ?? []);
  const chooseTemplate = (key: string) => {
    setTemplate(key);
    const t = rbac.templates.find((x) => x.key === key);
    if (t) setPerms(t.permissions);
  };
  const togglePerm = (key: string) => {
    setTemplate("custom");
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));
  };
  const groups = rbac.permissions.reduce<Record<string, RbacPermission[]>>((acc, p) => ({ ...acc, [p.group]: [...(acc[p.group] ?? []), p] }), {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter a name.");
    if (!admin && !email.trim()) return setError("Enter an email.");
    if (!admin && password.length < 8) return setError("Password must be at least 8 characters.");
    if (admin && password && password.length < 8) return setError("Password must be at least 8 characters.");
    if (role === "subadmin" && picked.length === 0) return setError("Choose at least one country.");
    if (role === "subadmin" && perms.length === 0) return setError("Give this admin at least one permission.");
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), role, countries: role === "subadmin" ? picked : [], ...(role === "subadmin" && { roleTemplate: template, permissions: perms }), ...(password && { password }), ...(!admin && { email: email.trim() }) };
      const saved = (await call(admin ? `/api/admins/${admin.id}` : "/api/admins", json(admin ? "PATCH" : "POST", payload))) as AdminRow;
      void saved;
      router.push("/admins");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl">
      <Link href="/admins" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to admins
      </Link>
      <PageHeader
        icon={UserCog}
        title={admin ? "Edit admin" : "Add admin"}
        description={admin ? admin.email : "They sign in with this email and password."}
      />
      <Card className="p-6">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

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

          {role === "subadmin" && (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-fg-2">What they can do</span>
              <div className="grid grid-cols-2 gap-2">
                {[...rbac.templates, { key: "custom", label: "Custom", description: "", permissions: [] }].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    aria-pressed={template === t.key}
                    onClick={() => (t.key === "custom" ? setTemplate("custom") : chooseTemplate(t.key))}
                    className={cn("rounded-xl px-3 py-2 text-left text-sm font-semibold ring-1 transition active:scale-95", template === t.key ? "bg-primary-soft text-primary ring-2 ring-primary" : "bg-surface text-fg-2 ring-border hover:bg-surface-2")}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-subtle">{rbac.templates.find((t) => t.key === template)?.description ?? "Tick exactly what they may do."}</p>
              <div className="mt-3 space-y-3 rounded-xl bg-surface-2 p-3 ring-1 ring-border">
                {Object.entries(groups).map(([group, items]) => (
                  <div key={group}>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{group}</p>
                    <div className="space-y-1">
                      {items.map((p) => (
                        <label key={p.key} className="flex cursor-pointer items-start gap-2 text-xs text-fg-2">
                          <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-[var(--primary)]" checked={perms.includes(p.key)} onChange={() => togglePerm(p.key)} />
                          <span>{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-5">
          <Link href="/admins">
            <Button type="button" variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : admin ? "Save changes" : "Add admin"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
