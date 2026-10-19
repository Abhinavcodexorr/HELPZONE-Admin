"use client";

import { useCallback, useEffect, useState } from "react";
import type { ServerDashboard } from "@/lib/dashboard-metrics";

/**
 * The backend's aggregate dashboard numbers. `stats` stays null when the endpoint
 * isn't available (older backend), and the dashboard then computes from the lists.
 */
export function useDashboardStats() {
  const [stats, setStats] = useState<ServerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(async () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const res = await fetch(`/api/dashboard?tz=${encodeURIComponent(tz)}`, { cache: "no-store" });
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload drops the old session's data
      if (res.status === 401) window.location.href = "/login";
      const body = await res.json().catch(() => null);
      if (res.ok && body?.success) setStats(body as ServerDashboard);
      else if (res.status === 404) setStats(null); // backend without this endpoint yet
    } catch {
      // Keep the last good numbers; the next tick retries.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(sync);
  }, [sync]);

  return { stats, loading, sync };
}
