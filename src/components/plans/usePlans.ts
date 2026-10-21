"use client";

import { useCallback, useEffect, useState } from "react";
import type { Plan, PlanInput } from "@/types";

type ApiBody = { success?: boolean; message?: string; data?: unknown };

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

const bySort = (a: Plan, b: Plan) => a.sortOrder - b.sortOrder || a.price - b.price;

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await call("/api/plans");
      setPlans(((body.data as Plan[]) ?? []).sort(bySort));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const replace = (updated: Plan) =>
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)).sort(bySort));

  const create = useCallback(async (input: PlanInput) => {
    const body = await call("/api/plans", json("POST", input));
    const created = body.data as Plan;
    setPlans((prev) => [...prev, created].sort(bySort));
    return created;
  }, []);

  const update = useCallback(async (id: string, input: PlanInput) => {
    const body = await call(`/api/plans/${id}`, json("PATCH", input));
    replace(body.data as Plan);
    return body.data as Plan;
  }, []);

  const setActive = useCallback(async (id: string, isActive: boolean) => {
    const body = await call(`/api/plans/${id}/${isActive ? "activate" : "deactivate"}`, { method: "PATCH" });
    replace(body.data as Plan);
    return body.data as Plan;
  }, []);

  const remove = useCallback(async (id: string) => {
    await call(`/api/plans/${id}`, { method: "DELETE" });
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { plans, loading, error, reload: load, create, update, setActive, remove };
}
