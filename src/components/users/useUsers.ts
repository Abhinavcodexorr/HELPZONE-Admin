"use client";

import { useCallback, useEffect, useState } from "react";
import type { User, UserDetail } from "@/types";
import { mapToUser, mapToUserDetail, type BackendCustomer, type BackendCustomerDetail } from "@/lib/map-customer";

type ApiBody = { success?: boolean; message?: string; data?: BackendCustomer[] | BackendCustomer | BackendCustomerDetail };

async function call(url: string, init?: RequestInit): Promise<ApiBody> {
  const res = await fetch(url, { cache: "no-store", ...init });
  // The session ended: send the admin back to sign in.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload drops the old session's data
  if (res.status === 401 && typeof window !== "undefined") window.location.href = "/login";
  const body = (await res.json().catch(() => ({ success: false, message: "Invalid response" }))) as ApiBody;
  if (!res.ok || body.success === false) throw new Error(body.message || "Something went wrong");
  return body;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await call("/api/users");
      setUsers(((body.data as BackendCustomer[]) ?? []).map(mapToUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const patchUser = (id: string, patch: Partial<User>) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  // Blocking keeps the booking count already on screen (the endpoint doesn't recompute it).
  // `until` (ISO) makes it a timed block that ends by itself; null = until unblocked.
  const block = useCallback(async (id: string, reason: string, until: string | null) => {
    const body = await call(`/api/users/${id}/deactivate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, ...(until && { until }) }),
    });
    const saved = body.data as BackendCustomer | undefined;
    patchUser(id, {
      status: "inactive",
      blockReason: saved?.blockReason ?? reason,
      blockedAt: saved?.blockedAt ?? new Date().toISOString(),
      blockedUntil: saved?.blockedUntil ?? until,
    });
  }, []);

  const unblock = useCallback(async (id: string) => {
    await call(`/api/users/${id}/activate`, { method: "PATCH" });
    patchUser(id, { status: "active", blockReason: "", blockedAt: null, blockedUntil: null });
  }, []);

  const loadDetail = useCallback(async (id: string): Promise<UserDetail> => {
    const body = await call(`/api/users/${id}`);
    return mapToUserDetail(body.data as unknown as BackendCustomerDetail);
  }, []);

  return { users, loading, error, reload: load, block, unblock, loadDetail };
}
