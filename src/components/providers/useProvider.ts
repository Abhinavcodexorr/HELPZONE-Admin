"use client";

import { useCallback, useEffect, useState } from "react";
import type { Provider } from "@/types";
import { mapToProvider, type BackendProvider } from "@/lib/map-provider";

/** One provider straight from the API (GET /api/providers/:id). `reload` refetches quietly. */
export function useProvider(id: string) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<Provider | null> => {
    try {
      const res = await fetch(`/api/providers/${encodeURIComponent(id)}`, { cache: "no-store" });
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload drops the old session's data
      if (res.status === 401) window.location.href = "/login";
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(res.status === 404 ? "This provider no longer exists." : json?.message || "Failed to load provider");
      const mapped = mapToProvider(json.data as BackendProvider);
      setProvider(mapped);
      setError(null);
      return mapped;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load provider");
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  return { provider, loading, error, reload: load };
}
