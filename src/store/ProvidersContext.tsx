"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Provider, UpdateProviderInput } from "@/types";
import { mapToProvider, BackendProvider } from "@/lib/map-provider";

interface ProvidersContextValue {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** Reloads the list without the loading skeleton (used by the notification poll). */
  sync: () => Promise<void>;
  verify: (id: string) => Promise<void>;
  approve: (id: string) => Promise<void>;
  reject: (id: string, reason: string) => Promise<void>;
  update: (id: string, input: UpdateProviderInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const ProvidersContext = createContext<ProvidersContextValue | null>(null);

async function parseJson(res: Response): Promise<{ success?: boolean; message?: string; data?: unknown }> {
  // The session cookie expired (or was cleared): send the admin back to sign in.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload drops the old session's data
  if (res.status === 401 && typeof window !== "undefined") window.location.href = "/login";
  return res.json().catch(() => ({ success: false, message: "Invalid response" }));
}

export function ProvidersProvider({ children }: { children: React.ReactNode }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/providers?limit=200", { cache: "no-store" });
      const json = await parseJson(res);
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Failed to load providers");
      }
      setProviders(((json.data as BackendProvider[]) ?? []).map(mapToProvider));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, []);

  const sync = useCallback(async () => {
    try {
      const res = await fetch("/api/providers?limit=200", { cache: "no-store" });
      const json = await parseJson(res);
      if (!res.ok || json.success === false) return;
      setProviders(((json.data as BackendProvider[]) ?? []).map(mapToProvider));
    } catch {
      // Keep the current list; the next poll or manual refresh will retry.
    }
  }, []);

  useEffect(() => {
    // Deferred via a microtask so the effect body itself never synchronously
    // triggers a state update (react-hooks/set-state-in-effect).
    queueMicrotask(load);
  }, [load]);

  const verify = useCallback(async (id: string) => {
    const res = await fetch(`/api/providers/${id}/verify`, { method: "PATCH" });
    const json = await parseJson(res);
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Failed to start verification");
    }
    const updated = mapToProvider(json.data as BackendProvider);
    setProviders((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const approve = useCallback(async (id: string) => {
    const res = await fetch(`/api/providers/${id}/approve`, { method: "PATCH" });
    const json = await parseJson(res);
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Failed to approve provider");
    }
    const updated = mapToProvider(json.data as BackendProvider);
    setProviders((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const reject = useCallback(async (id: string, reason: string) => {
    const res = await fetch(`/api/providers/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const json = await parseJson(res);
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Failed to reject provider");
    }
    const updated = mapToProvider(json.data as BackendProvider);
    setProviders((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const update = useCallback(async (id: string, input: UpdateProviderInput) => {
    const res = await fetch(`/api/providers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await parseJson(res);
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Failed to update provider");
    }
    const updated = mapToProvider(json.data as BackendProvider);
    setProviders((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
    const json = await parseJson(res);
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Failed to delete provider");
    }
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = useMemo(
    () => ({ providers, loading, error, refresh: load, sync, verify, approve, reject, update, remove }),
    [providers, loading, error, load, sync, verify, approve, reject, update, remove]
  );

  return <ProvidersContext.Provider value={value}>{children}</ProvidersContext.Provider>;
}

export function useProviders() {
  const ctx = useContext(ProvidersContext);
  if (!ctx) throw new Error("useProviders must be used within ProvidersProvider");
  return ctx;
}
