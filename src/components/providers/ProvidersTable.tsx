"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { MessageCircle, Phone } from "lucide-react";
import { ProviderStatus } from "@/types";
import { useProviders } from "@/store/ProvidersContext";
import { IdProofThumbnail } from "./IdProofThumbnail";
import { PhotoThumbnail } from "./PhotoThumbnail";
import { ProviderDetailModal } from "./ProviderDetailModal";
import { RejectModal } from "./RejectModal";
import { EditProviderModal } from "./EditProviderModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { ActionsMenu } from "./ActionsMenu";

const statusTone: Record<ProviderStatus, "green" | "amber" | "red"> = {
  approved: "green",
  pending: "amber",
  rejected: "red",
};

const statusTabs: { label: string; value: ProviderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export function ProvidersTable() {
  const { providers, loading, error, refresh, approve, reject, update, remove } = useProviders();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProviderStatus | "all">("all");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const handleApprove = (id: string) => runAction(id, () => approve(id), "Failed to approve provider");
  const handleReject = (id: string, reason: string) =>
    runAction(id, () => reject(id, reason), "Failed to reject provider");

  const counts = useMemo(
    () => ({
      all: providers.length,
      pending: providers.filter((p) => p.status === "pending").length,
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
      const matchesStatus = status === "all" || p.status === status;
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
          <div className="flex gap-1.5 overflow-x-auto">
            {statusTabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatus(t.value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
                  status === t.value
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-surface-3 text-fg-2 hover:bg-border"
                }`}
              >
                {t.label}
                {!loading && (
                  <span
                    className={`animate-fade-in rounded-full px-1.5 py-0.5 text-[10px] ${
                      status === t.value ? "bg-background/25" : "bg-surface text-muted"
                    }`}
                  >
                    {counts[t.value]}
                  </span>
                )}
              </button>
            ))}
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
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-subtle">
              <th className="w-20 px-4 py-3 font-medium">Photo</th>
              <th className="min-w-[170px] px-4 py-3 font-medium">Provider</th>
              <th className="min-w-[140px] px-4 py-3 font-medium">Category</th>
              <th className="min-w-[130px] px-4 py-3 font-medium">Location</th>
              <th className="min-w-[210px] px-4 py-3 font-medium">Contact</th>
              <th className="min-w-[190px] px-4 py-3 font-medium">ID Proof</th>
              <th className="min-w-[120px] px-4 py-3 font-medium">Status</th>
              <th className="min-w-[130px] px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && filtered.map((p, index) => {
              const busy = busyId === p.id;
              const showWhatsapp = p.whatsappNumber !== "—" && p.whatsappNumber !== p.mobileNumber;
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
                    <PhotoThumbnail provider={p} />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="whitespace-nowrap font-semibold text-foreground transition-colors group-hover:text-primary">{p.fullName}</p>
                    <p className="whitespace-nowrap text-xs text-muted">
                      {p.gender} &middot; {p.nationality}
                    </p>
                    <p className="mt-0.5 whitespace-nowrap text-xs text-subtle">Applied {formatDate(p.submittedAt)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone="indigo">{p.category}</Badge>
                    <p className="mt-1.5 whitespace-nowrap text-xs text-muted">
                      {p.experienceYears} {p.experienceYears === 1 ? "yr" : "yrs"} experience
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="whitespace-nowrap text-fg-2">{p.area}</p>
                    <p className="whitespace-nowrap text-xs text-muted">{p.city}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="flex items-center gap-1.5 text-fg-2">
                      <Phone className="h-3 w-3 shrink-0 text-subtle" />
                      {p.mobileNumber}
                    </p>
                    {showWhatsapp && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                        <MessageCircle className="h-3 w-3 shrink-0 text-subtle" />
                        {p.whatsappNumber}
                      </p>
                    )}
                    <p className="mt-0.5 max-w-[210px] truncate text-xs text-muted" title={p.email}>
                      {p.email}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <IdProofThumbnail provider={p} />
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={statusTone[p.status]}>{p.status}</Badge>
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
                        canApprove={p.status === "pending"}
                        busy={busy}
                        onView={() => setViewingId(p.id)}
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
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-subtle">
                  {providers.length === 0
                    ? "No provider applications yet."
                    : "No providers match your filters."}
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
            Showing {filtered.length} of {providers.length} providers
          </span>
        )}
      </div>

      {viewingProvider && (
        <ProviderDetailModal
          provider={viewingProvider}
          onClose={() => setViewingId(null)}
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
        <Skeleton className="h-11 w-11 rounded-xl" />
      </td>
      <td className="px-4 py-3.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-20" />
        <Skeleton className="mt-1.5 h-3 w-24" />
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
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-36" />
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
        <Skeleton className="h-6 w-16 rounded-full" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}
