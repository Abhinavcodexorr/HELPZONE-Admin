"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { hasPermission } from "@/lib/permissions";

interface AccessValue {
  permissions: string[];
  /** manager | verifier | support | viewer | custom | superadmin */
  template: string;
  isSuperadmin: boolean;
  /** Whether the signed-in admin may do this (e.g. "providers.edit"). The server checks again. */
  can: (permission: string) => boolean;
  /** Called with fresh rights from the server (an admin's permissions can change while they are signed in). */
  update: (next: { permissions: string[]; template: string }) => void;
}

const AccessContext = createContext<AccessValue | null>(null);

export function AccessProvider({
  permissions: initialPermissions,
  template: initialTemplate,
  isSuperadmin,
  children,
}: {
  permissions: string[];
  template: string;
  isSuperadmin: boolean;
  children: React.ReactNode;
}) {
  const [state, setState] = useState({ permissions: initialPermissions, template: initialTemplate });
  const update = useCallback((next: { permissions: string[]; template: string }) => {
    setState((prev) =>
      prev.template === next.template && prev.permissions.length === next.permissions.length && prev.permissions.every((p) => next.permissions.includes(p))
        ? prev
        : next,
    );
  }, []);
  const value = useMemo<AccessValue>(
    () => ({
      permissions: state.permissions,
      template: state.template,
      isSuperadmin,
      can: (permission: string) => hasPermission(state.permissions, permission),
      update,
    }),
    [state, isSuperadmin, update],
  );
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used inside AccessProvider");
  return ctx;
}
