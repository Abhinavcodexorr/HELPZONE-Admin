"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { formatDate, formatTime } from "@/lib/utils";
import { Phone } from "lucide-react";
import { providerStages } from "@/lib/provider-stages";
import { ProviderStatus } from "@/types";
import { useProviders } from "@/store/ProvidersContext";
import { DocumentThumbnail } from "./DocumentThumbnail";
import { IdProofThumbnail } from "./IdProofThumbnail";
import { PhotoThumbnail } from "./PhotoThumbnail";
import { VideoThumbnail } from "./VideoThumbnail";
import { ProviderDetailModal } from "./ProviderDetailModal";
import { RejectModal } from "./RejectModal";
import { EditProviderModal } from "./EditProviderModal";
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
  const { providers, loading, error, refresh, viewRequest, requestView, verify, approve, reject, update, remove } = useProviders();
  const stage = providerStages.find((t) => t.status === status) ?? providerStages[0];
  // Each stage page mounts its own table, so opening a stage reloads the list
  // from the API and every stage shows current data. On a hard page load the
  // provider is still doing its first fetch (loading), so nothing extra is
  // requested; the ref also stops Strict Mode's double effect from fetching twice.
  const dataWasLoaded = useRef(!loading);
  const refreshed = useRef(false);
  useEffect(() => {
    if (!dataWasLoaded.current || refreshed.current) return;
    refreshed.current = true;
    queueMicrotask(refresh);
  }, [refresh]);

  const [query, setQuery] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // A notification asked for this provider's details: open the popup once the
  // list contains it (the list may still be reloading), then clear the request.
  useEffect(() => {
    if (!viewRequest || !providers.some((p) => p.id === viewRequest)) return;
    queueMicrotask(() => {
      setViewingId(viewRequest);
      requestView(null);
    });
  }, [viewRequest, providers, requestView]);

  async function runAction(id: string, action: () => Promise<void>, fallback: string) {
    setActionError(null);
    setBusyId(id);
    try {
      await action();
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

  const counts = useMemo(
    () => ({
      pending: providers.filter((p) => p.status === "pending").length,
      verification: providers.filter((p) => p.status === "verification").length,
      approved: providers.filter((p) => p.status === "approved").length,
      rejected: providers.filter((p) => p.status === "rejected").length,
    }),
    [providers]
  );

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchesQuery =
        p.fullName.toLowerCase().includes(query.toLowerCase()) ||
        p.email.toLowerCase().includes(query.toLowerCase()) ||
        p.city.toLowerCase().includes(query.toLowerCase()) ||
        p.kyc.idNumber.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = p.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [providers, query, status]);

  const viewingProvider = providers.find((p) => p.id === viewingId);
  const rejectingProvider = providers.find((p) => p.id === rejectingId);
  const editingProvider = providers.find((p) => p.id === editingId);
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
              <p className="text-xs text-muted">{loading ? "Loading…" : `${counts[status]} ${counts[status] === 1 ? "provider" : "providers"}`}</p>
            </div>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search name, email, city, ID number..."
          />
        </div>
      </div>

      {actionError && (
        <div className="border-b border-border bg-danger-soft px-4 py-2 text-xs text-danger">{actionError}</div>
      )}

      {error && (
        <div className="flex items-center justify-between border-b border-border bg-danger-soft px-4 py-2 text-xs text-danger">
          <span>{error}</span>
          <button onClick={refresh} className="font-medium underline">
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
              <th className="min-w-[150px] px-4 py-3 font-medium">Services</th>
              <th className="min-w-[120px] px-4 py-3 font-medium">Location</th>
              <th className="min-w-[190px] px-4 py-3 font-medium">Aadhaar</th>
              <th className="min-w-[190px] px-4 py-3 font-medium">PAN</th>
              <th className="min-w-[150px] px-4 py-3 font-medium">Video</th>
              <th className="min-w-[130px] px-4 py-3 font-medium">Status</th>
              <th className="min-w-[110px] px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && filtered.map((p, index) => {
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
                    setViewingId(p.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target === e.currentTarget) setViewingId(p.id);
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
                      {p.gender} &middot; {p.nationality}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="flex items-center gap-1.5 whitespace-nowrap text-fg-2">
                      <Phone className="h-3 w-3 shrink-0 text-subtle" />
                      {p.mobileNumber}
                    </p>
                    <p className="mt-0.5 max-w-[190px] truncate text-xs text-muted" title={p.email}>
                      {p.email}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    {p.categories.length === 0 ? (
                      <span className="text-xs text-subtle">No service</span>
                    ) : (
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
                    <p className="mt-1.5 whitespace-nowrap text-xs text-muted">
                      {p.experienceYears} {p.experienceYears === 1 ? "yr" : "yrs"} experience
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="whitespace-nowrap text-fg-2">{p.city}</p>
                    {p.state && <p className="whitespace-nowrap text-xs text-muted">{p.state}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <IdProofThumbnail provider={p} />
                  </td>
                  <td className="px-4 py-3.5">
                    {p.panCard ? (
                      <DocumentThumbnail
                        providerName={p.fullName}
                        idType="PAN Card"
                        idNumber={p.panCard.idNumber}
                        idDocumentImage={p.panCard.idDocumentImage}
                      />
                    ) : (
                      <p className="whitespace-nowrap font-mono text-xs tracking-wide text-fg-2">
                        {p.panNumber || "—"}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <VideoThumbnail provider={p} />
                  </td>
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
                        onView={() => setViewingId(p.id)}
                        onVerify={() => handleVerify(p.id)}
                        onApprove={() => handleApprove(p.id)}
                        onReject={() => setRejectingId(p.id)}
                        onEdit={() => setEditingId(p.id)}
                        onDelete={() => setDeletingId(p.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-sm text-subtle">
                  {providers.length === 0
                    ? "No provider applications yet."
                    : query
                      ? "No providers match your search."
                      : `No providers in ${stage.label}.`}
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
            Showing {filtered.length} of {counts[status]} in {stage.label}
          </span>
        )}
      </div>

      {viewingProvider && (
        <ProviderDetailModal
          provider={viewingProvider}
          onClose={() => setViewingId(null)}
          onVerify={handleVerify}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {rejectingProvider && !viewingProvider && (
        <RejectModal
          providerName={rejectingProvider.fullName}
          onCancel={() => setRejectingId(null)}
          onConfirm={(reason) => {
            handleReject(rejectingProvider.id, reason);
            setRejectingId(null);
          }}
        />
      )}

      {editingProvider && (
        <EditProviderModal
          provider={editingProvider}
          onClose={() => setEditingId(null)}
          onSave={update}
        />
      )}

      {deletingProvider && (
        <DeleteConfirmModal
          providerName={deletingProvider.fullName}
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => {
            await remove(deletingProvider.id);
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
