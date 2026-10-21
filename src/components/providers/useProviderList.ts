"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Provider, ProviderStatus } from "@/types";
import { mapToProvider, type BackendProvider } from "@/lib/map-provider";
import { providerListQuery, type ProviderFilters } from "@/lib/list-filters";

export const PAGE_SIZE = 25;
const POLL_MS = 30_000;

export interface ProviderFacets {
  services: { key: string; count: number }[];
  cities: { name: string; count: number }[];
  gender: { Male?: number; Female?: number };
}

interface Result {
  providers: Provider[];
  /** Matches for the current filters. */
  total: number;
  pages: number;
  /** Stage totals as the backend counts them (ignores filters). */
  counts: Record<ProviderStatus, number> | null;
  facets: ProviderFacets;
}

const empty: Result = { providers: [], total: 0, pages: 1, counts: null, facets: { services: [], cities: [], gender: {} } };

/**
 * One stage's provider list, straight from the API for exactly the chosen filters, search and page.
 * Every change refetches (search is debounced); the backend does the filtering and sorting.
 * `refresh` reloads quietly; the list also refreshes itself every 30s while the tab is visible.
 */
export function useProviderList(status: ProviderStatus, search: string, filters: ProviderFilters) {
  const [data, setData] = useState<Result>(empty);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true); // first load / the list is being swapped
  const [fetching, setFetching] = useState(false); // any request in flight
  const [error, setError] = useState<string | null>(null);
  const [debounced, setDebounced] = useState(search);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // A different stage, search or filter means starting again from page 1.
  const filterKey = JSON.stringify(filters);
  const [resetKey, setResetKey] = useState(`${status}|${debounced}|${filterKey}`);
  const currentKey = `${status}|${debounced}|${filterKey}`;
  if (resetKey !== currentKey) {
    setResetKey(currentKey);
    setPage(1);
    setLoading(true);
  }

  const fetchList = useCallback(
    async (quiet: boolean) => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setFetching(true);
      if (!quiet) setLoading(true);
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const qs = providerListQuery(status, debounced, filters, page, PAGE_SIZE, tz);
        const res = await fetch(`/api/providers?${qs}`, { cache: "no-store", signal: controller.signal });
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload drops the old session's data
        if (res.status === 401) window.location.href = "/login";
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to load providers");
        setData({
          providers: ((json.data as BackendProvider[]) ?? []).map(mapToProvider),
          total: json.total ?? 0,
          pages: Math.max(1, json.pages ?? 1),
          counts: json.counts ?? null,
          facets: json.facets ?? empty.facets,
        });
        setError(null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load providers");
      } finally {
        if (abort.current === controller) {
          setLoading(false);
          setFetching(false);
        }
      }
    },
    // `filters` is represented by filterKey so a new-but-equal object doesn't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, debounced, filterKey, page],
  );

  useEffect(() => {
    queueMicrotask(() => fetchList(false));
    return () => abort.current?.abort();
  }, [fetchList]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden) void fetchList(true);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [fetchList]);

  const refresh = useCallback(() => fetchList(true), [fetchList]);

  return { ...data, page, setPage, loading, fetching, error, refresh, reload: () => fetchList(false) };
}
