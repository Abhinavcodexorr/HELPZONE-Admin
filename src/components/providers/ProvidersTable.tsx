"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterGroup, FilterToolbar, Pill, PillRow, SelectField, toggle } from "@/components/ui/filters";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { providerStages } from "@/lib/provider-stages";
import {
  datePresets,
  defaultProviderFilters,
  describeProviderFilters,
  experienceBuckets,
  providerSorts,
  type ProviderFilters,
} from "@/lib/list-filters";
import { PAGE_SIZE, useProviderList } from "./useProviderList";
import type { ProviderStatus } from "@/types";
import { labelForCategory } from "@/lib/map-provider";
import { NEW_PROVIDER_EVENT } from "@/components/notifications/NewProviderNotifier";
import { useProviders } from "@/store/ProvidersContext";
import { RejectModal } from "./RejectModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { ProviderCard, ProviderCardSkeleton } from "./ProviderCard";

export function ProvidersTable({ status }: { status: ProviderStatus }) {
  // The context list feeds the dashboard and notifications, and the actions below; this table's own rows
  // come from the API for exactly the chosen filters (see useProviderList).
  const router = useRouter();
  const { verify, approve, reject, remove } = useProviders();
  const stage = providerStages.find((t) => t.status === status) ?? providerStages[0];

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ProviderFilters>(defaultProviderFilters);
  const patch = (next: Partial<ProviderFilters>) => setFilters((f) => ({ ...f, ...next }));
  const list = useProviderList(status, query, filters);
  const { providers, loading, fetching, error, total, pages, page, setPage, counts, facets, refresh } = list;

  // The notification poll saw a new registration: reload this list.
  useEffect(() => {
    window.addEventListener(NEW_PROVIDER_EVENT, refresh);
    return () => window.removeEventListener(NEW_PROVIDER_EVENT, refresh);
  }, [refresh]);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const openDetails = (id: string) => router.push(`/providers/${stage.slug}/${id}`);
  const openEdit = (id: string) => router.push(`/providers/${stage.slug}/${id}/edit`);

  async function runAction(id: string, action: () => Promise<void>, fallback: string) {
    setActionError(null);
    setBusyId(id);
    try {
      await action();
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusyId(null);
    }
  }

  const handleVerify = (id: string) => runAction(id, () => verify(id), "Failed to start verification");
  const handleApprove = (id: string) => runAction(id, () => approve(id), "Failed to approve provider");
  const handleReject = (id: string, reason: string) =>
    runAction(id, () => reject(id, reason), "Failed to reject provider");

  const stageTotal = counts?.[status] ?? 0;

  const chips = describeProviderFilters(filters, labelForCategory).map((c) => ({
    key: c.key,
    label: c.label,
    onRemove: () => setFilters((f) => ({ ...f, ...(typeof c.clear === "function" ? c.clear(f) : c.clear) })),
  }));
  const clearFilters = () => setFilters((f) => ({ ...defaultProviderFilters, sort: f.sort }));
  const filtersActive = chips.length > 0 || query.trim() !== "";

  const rejectingProvider = providers.find((p) => p.id === rejectingId);
  const deletingProvider = providers.find((p) => p.id === deletingId);

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <stage.icon className="h-[18px] w-[18px]" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">{stage.label}</p>
              <p className="text-xs text-muted">{counts === null ? "Loading…" : `${stageTotal} ${stageTotal === 1 ? "provider" : "providers"}`}</p>
            </div>
          </div>
        </div>

        <FilterToolbar
          query={query}
          onQuery={setQuery}
          placeholder="Search name, phone, city, ID number..."
          sort={filters.sort}
          sortOptions={providerSorts}
          onSort={(sort) => patch({ sort })}
          chips={chips}
          onClear={clearFilters}
          panel={
            <>
              <FilterGroup label="Service">
                {facets.services.length === 0 ? (
                  <p className="text-xs text-subtle">No services on these providers yet.</p>
                ) : (
                  <PillRow>
                    {facets.services.map(({ key, count }) => (
                      <Pill key={key} active={filters.services.includes(key)} onClick={() => patch({ services: toggle(filters.services, key) })} count={count}>
                        {labelForCategory(key)}
                      </Pill>
                    ))}
                  </PillRow>
                )}
              </FilterGroup>
              <FilterGroup label="City">
                <SelectField
                  label="City"
                  value={filters.city}
                  onChange={(city) => patch({ city })}
                  options={[{ value: "", label: "All cities" }, ...facets.cities.map((c) => ({ value: c.name, label: `${c.name} (${c.count})` }))]}
                />
              </FilterGroup>
              <FilterGroup label="Experience">
                <PillRow>
                  {experienceBuckets.map((b) => (
                    <Pill key={b.value} active={filters.experience.includes(b.value)} onClick={() => patch({ experience: toggle(filters.experience, b.value) })}>
                      {b.label}
                    </Pill>
                  ))}
                </PillRow>
              </FilterGroup>
              <FilterGroup label="Applied">
                <SelectField label="Applied" value={filters.applied} onChange={(applied) => patch({ applied: applied as ProviderFilters["applied"] })} options={datePresets} />
              </FilterGroup>
            </>
          }
        />
      </div>

      {actionError && (
        <div className="border-b border-border bg-danger-soft px-4 py-2 text-xs text-danger">{actionError}</div>
      )}

      {error && (
        <div className="flex items-center justify-between border-b border-border bg-danger-soft px-4 py-2 text-xs text-danger">
          <span>{error}</span>
          <button onClick={() => list.reload()} className="font-medium underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProviderCardSkeleton key={i} />
          ))}
        </div>
      ) : providers.length === 0 ? (
        !error && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-sm text-subtle">
            {filtersActive && stageTotal > 0 ? (
              <>
                No providers match these filters.
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    clearFilters();
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Clear search and filters
                </button>
              </>
            ) : (
              `No providers in ${stage.label}.`
            )}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {providers.map((p, index) => (
            <ProviderCard
              key={p.id}
              provider={p}
              index={index}
              busy={busyId === p.id}
              onOpen={() => openDetails(p.id)}
              onVerify={() => handleVerify(p.id)}
              onApprove={() => handleApprove(p.id)}
              onReject={() => setRejectingId(p.id)}
              onEdit={() => openEdit(p.id)}
              onDelete={() => setDeletingId(p.id)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
        {loading ? (
          <Skeleton className="h-3.5 w-40" />
        ) : (
          <span>
            {total === 0
              ? `0 in ${stage.label}`
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + providers.length} of ${total}${filtersActive ? " matching" : ""} in ${stage.label}`}
            {fetching && !loading && <span className="ml-2 text-subtle">Updating…</span>}
          </span>
        )}
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || fetching}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-border transition hover:bg-surface-2 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 tabular-nums">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page >= pages || fetching}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-border transition hover:bg-surface-2 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {rejectingProvider && (
        <RejectModal
          providerName={rejectingProvider.fullName}
          onCancel={() => setRejectingId(null)}
          onConfirm={(reason) => {
            handleReject(rejectingProvider.id, reason);
            setRejectingId(null);
          }}
        />
      )}

      {deletingProvider && (
        <DeleteConfirmModal
          providerName={deletingProvider.fullName}
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => {
            await remove(deletingProvider.id);
            refresh();
            setDeletingId(null);
          }}
        />
      )}
    </Card>
  );
}
