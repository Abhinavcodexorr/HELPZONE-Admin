"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types";
import { mapToUser, type BackendCustomer } from "@/lib/map-customer";

type ApiBody = { success?: boolean; message?: string; data?: BackendCustomer[] };

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
      setUsers((body.data ?? []).map(mapToUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const setActive = useCallback(async (id: string, isActive: boolean) => {
    // The activate/deactivate endpoint doesn't recompute the booking count
    // (it returns a fresh serialization with bookingCount reset to 0), so
    // only the status/color/etc change here — the known booking count is
    // kept from what's already on screen rather than overwritten with 0.
    await call(`/api/users/${id}/${isActive ? "activate" : "deactivate"}`, { method: "PATCH" });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: isActive ? "active" : "inactive" } : u)));
  }, []);

  return { users, loading, error, reload: load, setActive };
}
