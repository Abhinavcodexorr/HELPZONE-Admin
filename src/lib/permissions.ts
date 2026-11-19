// Mirrors the backend's config/permissions.js. The backend is what actually enforces these;
// the panel uses them to hide what an admin can't use and to explain why.

export const ALL_PERMISSIONS = "*";

export function hasPermission(permissions: readonly string[], key: string): boolean {
  return permissions.includes(ALL_PERMISSIONS) || permissions.includes(key);
}

// Which permission opens which part of the panel.
const PAGE_RULES: { prefix: string; permission: string }[] = [
  { prefix: "/dashboard", permission: "dashboard.view" },
  { prefix: "/providers", permission: "providers.view" },
  { prefix: "/customers", permission: "customers.view" },
  { prefix: "/services", permission: "services.view" },
  { prefix: "/plans", permission: "plans.view" },
  { prefix: "/audit-logs", permission: "logs.view" },
];

export function pathAllowed(pathname: string, permissions: readonly string[], role: string): boolean {
  if (pathname === "/admins" || pathname.startsWith("/admins/")) return role === "superadmin";
  // Editing a provider needs more than looking at one.
  if (/^\/providers\/[^/]+\/[^/]+\/edit\/?$/.test(pathname)) return hasPermission(permissions, "providers.edit");
  const rule = PAGE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  return rule ? hasPermission(permissions, rule.permission) : true;
}

/** Where to send someone who can't open the page they asked for (null = nothing at all). */
export function firstAllowedPath(permissions: readonly string[], role: string): string | null {
  const order = ["/dashboard", "/providers/new", "/customers", "/services", "/plans", "/audit-logs"];
  if (role === "superadmin") return "/dashboard";
  return order.find((p) => pathAllowed(p, permissions, role)) ?? "/settings";
}

export interface RbacPermission {
  key: string;
  group: string;
  label: string;
}
export interface RbacTemplate {
  key: string;
  label: string;
  description: string;
  permissions: string[];
}
