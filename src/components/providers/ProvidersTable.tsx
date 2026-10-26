"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { FilterGroup, FilterToolbar, Pill, PillRow, SelectField, toggle } from "@/components/ui/filters";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { formatDate, formatTime } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react";
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
import { DocumentThumbnail } from "./DocumentThumbnail";
import { IdProofThumbnail } from "./IdProofThumbnail";
import { PhotoThumbnail } from "./PhotoThumbnail";
import { VideoThumbnail } from "./VideoThumbnail";
import { RejectModal } from "./RejectModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { ActionsMenu } from "./ActionsMenu";

const statusTone: Record<ProviderStatus, "green" | "amber" | "red" | "blue"> = {
  approved: "green",
  pending: "amber",
  verification: "blue",
  rejected: "red",
};

const statusDot: Record<ProviderStatus, string> = {
  approved: "bg-success-solid",
  pending: "bg-amber-400",
  verification: "bg-blue-500",
  rejected: "bg-danger-solid",
};

const statusLabel: Record<ProviderStatus, string> = {
  pending: "New request",
  verification: "In verification",
  approved: "Approved",
  rejected: "Rejected",
};

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

  // A column nobody on this page has data for is hidden; while loading (or with no rows) all stay so the skeleton lines up.
  const showAll = loading || providers.length === 0;
  const col = {
    services: showAll || providers.some((p) => p.categories.length > 0),
    location: showAll || providers.some((p) => p.city !== "—" || p.state),
    aadhaar: showAll || providers.some((p) => p.kyc.idDocumentImage),
    pan: showAll || providers.some((p) => p.panCard || p.panNumber),
    video: showAll || providers.some((p) => p.introVideoUrl),
  };
  const columnCount = 6 + Object.values(col).filter(Boolean).length;
  const genderCount = (g: "Male" | "Female") => facets.gender[g] ?? 0;

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
              <FilterGroup label="Gender">
                <PillRow>
                  {(["Male", "Female"] as const).map((g) => (
                    <Pill key={g} active={filters.gender === g} onClick={() => patch({ gender: filters.gender === g ? "any" : g })} count={genderCount(g)}>
                      {g}
                    </Pill>
                  ))}
                </PillRow>
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-subtle">
              <th className="min-w-[120px] px-4 py-3 font-medium">Applied on</th>
              <th className="w-20 px-4 py-3 font-medium">Profile</th>
              <th className="min-w-[160px] px-4 py-3 font-medium">Name</th>
              <th className="min-w-[190px] px-4 py-3 font-medium">Contact</th>
              {col.services && <th className="min-w-[150px] px-4 py-3 font-medium">Services</th>}
              {col.location && <th className="min-w-[120px] px-4 py-3 font-medium">Location</th>}
              {col.aadhaar && <th className="min-w-[190px] px-4 py-3 font-medium">Aadhaar</th>}
              {col.pan && <th className="min-w-[190px] px-4 py-3 font-medium">PAN</th>}
              {col.video && <th className="min-w-[150px] px-4 py-3 font-medium">Video</th>}
              <th className="min-w-[130px] px-4 py-3 font-medium">Status</th>
              <th className="min-w-[110px] px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && providers.map((p, index) => {
              const busy = busyId === p.id;
              return (
                <tr
                  key={p.id}
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                  tabIndex={0}
                  onClick={(e) => {
                    // Ignore clicks from portaled UI (lightbox, menu) that bubble up through React,
                    // and from the row's own buttons.
                    const target = e.target as HTMLElement;
                    if (!e.currentTarget.contains(target) || target.closest("button, a")) return;
                    openDetails(p.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target === e.currentTarget) openDetails(p.id);
                  }}
                  className="group animate-fade-in cursor-pointer border-b border-border align-middle transition-colors last:border-0 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
                >
                  <td className="px-4 py-3.5">
                    <p className="whitespace-nowrap text-fg-2">{formatDate(p.submittedAt)}</p>
                    <p className="whitespace-nowrap text-xs text-muted">{formatTime(p.submittedAt)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="relative w-fit">
                      <PhotoThumbnail provider={p} />
                      <span
                        title={statusLabel[p.status]}
                        className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-surface ${statusDot[p.status]}`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="whitespace-nowrap font-semibold text-foreground transition-colors group-hover:text-primary">
                      {p.fullName}
                    </p>
                    <p className="whitespace-nowrap text-xs text-muted">
                      {[p.gender, p.nationality !== "—" ? p.nationality : ""].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    {p.mobileNumber !== "—" && (
                      <p className="flex items-center gap-1.5 whitespace-nowrap text-fg-2">
                        <Phone className="h-3 w-3 shrink-0 text-subtle" />
                        {p.mobileNumber}
                      </p>
                    )}
                    {p.email && (
                      <p className="mt-0.5 max-w-[190px] truncate text-xs text-muted" title={p.email}>
                        {p.email}
                      </p>
                    )}
                  </td>
                  {col.services && (
                  <td className="px-4 py-3.5">
                    {p.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.categories.slice(0, 2).map((c) => (
                          <Badge key={c} tone="indigo">
                            {c}
                          </Badge>
                        ))}
                        {p.categories.length > 2 && (
                          <Badge tone="gray" className="px-2">
                            +{p.categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </td>
                  )}
                  {col.location && (
                  <td className="px-4 py-3.5">
                    {p.city !== "—" && <p className="whitespace-nowrap text-fg-2">{p.city}</p>}
                    {p.state && <p className="whitespace-nowrap text-xs text-muted">{p.state}</p>}
                  </td>
                  )}
                  {col.aadhaar && (
                  <td className="px-4 py-3.5">{p.kyc.idDocumentImage && <IdProofThumbnail provider={p} />}</td>
                  )}
                  {col.pan && (
                  <td className="px-4 py-3.5">
                    {p.panCard ? (
                      <DocumentThumbnail
                        providerName={p.fullName}
                        idType="PAN Card"
                        idNumber={p.panCard.idNumber}
                        idDocumentImage={p.panCard.idDocumentImage}
                      />
                    ) : (
                      p.panNumber && <p className="whitespace-nowrap font-mono text-xs tracking-wide text-fg-2">{p.panNumber}</p>
                    )}
                  </td>
                  )}
                  {col.video && (
                  <td className="px-4 py-3.5">{p.introVideoUrl && <VideoThumbnail provider={p} />}</td>
                  )}
                  <td className="px-4 py-3.5">
                    <Badge tone={statusTone[p.status]} dot>
                      {statusLabel[p.status]}
                    </Badge>
                    {p.status === "rejected" && p.rejectionReason && (
                      <p
                        className="mt-1.5 max-w-[170px] truncate text-xs text-danger"
                        title={p.rejectionReason}
                      >
                        {p.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end">
                      <ActionsMenu
                        canVerify={p.status === "pending"}
                        canApprove={p.status === "verification"}
                        busy={busy}
                        onView={() => openDetails(p.id)}
                        onVerify={() => handleVerify(p.id)}
                        onApprove={() => handleApprove(p.id)}
                        onReject={() => setRejectingId(p.id)}
                        onEdit={() => openEdit(p.id)}
                        onDelete={() => setDeletingId(p.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && !error && providers.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-12 text-center text-sm text-subtle">
                  {filtersActive && stageTotal > 0 ? (
                    <span className="flex flex-col items-center gap-2">
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
                    </span>
                  ) : (
                    `No providers in ${stage.label}.`
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

function SkeletonRow() {
  return (
    <tr className="border-b border-border align-middle last:border-0">
      <td className="px-4 py-3.5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-3 w-14" />
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-11 w-11 rounded-xl" />
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-20" />
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-36" />
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="mt-2 h-3 w-24" />
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-3 w-14" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-11 w-16 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-11 w-16 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-11 w-16 rounded-lg" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}
