import type { RbacPermission, RbacTemplate } from "@/lib/permissions";

export interface AdminRow {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "subadmin";
  countries: string[];
  permissions: string[];
  roleTemplate: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

export const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-2 placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export async function call(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...init });
  const body = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; data?: unknown };
  if (!res.ok || body.success === false) throw new Error(body.message || "Something went wrong");
  return body.data;
}

export const json = (method: string, payload: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

export interface Rbac {
  permissions: RbacPermission[];
  templates: RbacTemplate[];
}

