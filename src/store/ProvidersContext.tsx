"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Provider, ProviderStatus, UpdateProviderInput } from "@/types";
import { mapToProvider, BackendProvider } from "@/lib/map-provider";

export type StageCounts = Record<ProviderStatus, number>;

interface ProvidersContextValue {
  providers: Provider[];
  /** Per-stage totals and overall total as the backend counts them (accurate even if the list is capped). */
  serverCounts: StageCounts | null;
  serverTotal: number | null;
  /** When the list was last fetched successfully (ms since epoch). */
  lastSyncedAt: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** Reloads the list without the loading skeleton (used by the notification poll). */
  sync: () => Promise<void>;
  /** Provider the user asked to open (e.g. from a notification); the table shows it and clears this. */
  viewRequest: string | null;
  requestView: (id: string | null) => void;
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
  const [viewRequest, requestView] = useState<string | null>(null);
  const [serverCounts, setServerCounts] = useState<StageCounts | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const applyList = useCallback((json: { data?: unknown; counts?: unknown; total?: unknown }) => {
    setProviders(((json.data as BackendProvider[]) ?? []).map(mapToProvider));
    const c = json.counts as Partial<StageCounts> | undefined;
    setServerCounts(
      c && typeof c === "object"
        ? { pending: c.pending ?? 0, verification: c.verification ?? 0, approved: c.approved ?? 0, rejected: c.rejected ?? 0 }
        : null,
    );
    setServerTotal(typeof json.total === "number" ? json.total : null);
    setLastSyncedAt(Date.now());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/providers?limit=200", { cache: "no-store" });
      const json = await parseJson(res);
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Failed to load providers");
      }
      applyList(json as { data?: unknown; counts?: unknown; total?: unknown });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, [applyList]);

  const sync = useCallback(async () => {
    try {
      const res = await fetch("/api/providers?limit=200", { cache: "no-store" });
      const json = await parseJson(res);
      if (!res.ok || json.success === false) return;
      applyList(json as { data?: unknown; counts?: unknown; total?: unknown });
    } catch {
      // Keep the current list; the next poll or manual refresh will retry.
    }
  }, [applyList]);

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
    () => ({
      providers,
      serverCounts,
      serverTotal,
      lastSyncedAt,
      loading,
      error,
      refresh: load,
      sync,
      viewRequest,
      requestView,
      verify,
      approve,
      reject,
      update,
      remove,
    }),
    [providers, serverCounts, serverTotal, lastSyncedAt, loading, error, load, sync, viewRequest, verify, approve, reject, update, remove]
  );

  return <ProvidersContext.Provider value={value}>{children}</ProvidersContext.Provider>;
}

export function useProviders() {
  const ctx = useContext(ProvidersContext);
  if (!ctx) throw new Error("useProviders must be used within ProvidersProvider");
  return ctx;
}
