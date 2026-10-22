"use client";

import { useCallback, useEffect, useState } from "react";
import type { DetectedCategory, Service, ServiceInput } from "@/types";

type ApiBody = { success?: boolean; message?: string; data?: unknown; detected?: DetectedCategory[] };

async function call(url: string, init?: RequestInit): Promise<ApiBody> {
  const res = await fetch(url, { cache: "no-store", ...init });
  // The session ended: send the admin back to sign in.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload drops the old session's data
  if (res.status === 401 && typeof window !== "undefined") window.location.href = "/login";
  const body = (await res.json().catch(() => ({ success: false, message: "Invalid response" }))) as ApiBody;
  if (!res.ok || body.success === false) throw new Error(body.message || "Something went wrong");
  return body;
}

const json = (method: string, payload: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

export function useServices({ auto = true }: { auto?: boolean } = {}) {
  const [services, setServices] = useState<Service[]>([]);
  const [detected, setDetected] = useState<DetectedCategory[]>([]);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await call("/api/services");
      setServices((body.data as Service[]) ?? []);
      setDetected(body.detected ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auto) queueMicrotask(load);
  }, [auto, load]);

  /** Reloads without the loading skeleton (dashboard auto-refresh). Keeps the last good data on failure. */
  const sync = useCallback(async () => {
    try {
      const body = await call("/api/services");
      setServices((body.data as Service[]) ?? []);
      setDetected(body.detected ?? []);
      setError(null);
    } catch {
      // Leave what is on screen; the next tick retries.
    }
  }, []);

  const replace = (updated: Service) =>
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

  const create = useCallback(async (input: ServiceInput) => {
    const body = await call("/api/services", json("POST", input));
    const created = body.data as Service;
    setServices((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setDetected((prev) => prev.filter((d) => d.key !== created.key));
    return created;
  }, []);

  const update = useCallback(async (id: string, input: ServiceInput) => {
    const body = await call(`/api/services/${id}`, json("PATCH", input));
    const updated = body.data as Service;
    setServices((prev) =>
      prev.map((s) => (s.id === id ? updated : s)).sort((a, b) => a.name.localeCompare(b.name)),
    );
    return updated;
  }, []);

  const setActive = useCallback(async (id: string, isActive: boolean) => {
    const body = await call(`/api/services/${id}/${isActive ? "activate" : "deactivate"}`, { method: "PATCH" });
    const updated = body.data as Service;
    replace(updated);
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await call(`/api/services/${id}`, { method: "DELETE" });
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { services, detected, loading, error, reload: load, sync, create, update, setActive, remove };
}
