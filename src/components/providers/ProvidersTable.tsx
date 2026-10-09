"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { Check, MessageCircle, Phone, X } from "lucide-react";
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
  const [category, setCategory] = useState<string>("All");
  const [status, setStatus] = useState<ProviderStatus | "all">("all");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(providers.map((p) => p.category))).sort(),
    [providers]
  );

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
      const matchesCategory = category === "All" || p.category === category;
      const matchesStatus = status === "all" || p.status === status;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [providers, query, category, status]);

  const viewingProvider = providers.find((p) => p.id === viewingId);
  const rejectingProvider = providers.find((p) => p.id === rejectingId);
  const editingProvider = providers.find((p) => p.id === editingId);
  const deletingProvider = providers.find((p) => p.id === deletingId);

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-border p-4">
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory((prev) => (prev === c ? "All" : c))}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === c
                    ? "bg-primary text-white"
                    : "bg-surface-3 text-fg-2 hover:bg-border"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 overflow-x-auto">
            {statusTabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatus(t.value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === t.value
                    ? "bg-foreground text-background"
                    : "bg-surface-3 text-fg-2 hover:bg-border"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    status === t.value ? "bg-background/25" : "bg-surface-3 text-muted"
                  }`}
                >
                  {counts[t.value]}
                </span>
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

      {loading ? (
        <div className="px-4 py-10 text-center text-sm text-subtle">Loading providers…</div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1220px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-subtle">
              <th className="w-20 px-4 py-3 font-medium">Photo</th>
              <th className="min-w-[170px] px-4 py-3 font-medium">Provider</th>
              <th className="min-w-[140px] px-4 py-3 font-medium">Category</th>
              <th className="min-w-[130px] px-4 py-3 font-medium">Location</th>
              <th className="min-w-[210px] px-4 py-3 font-medium">Contact</th>
              <th className="min-w-[190px] px-4 py-3 font-medium">ID Proof</th>
              <th className="min-w-[120px] px-4 py-3 font-medium">Status</th>
              <th className="min-w-[230px] px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const busy = busyId === p.id;
              const showWhatsapp = p.whatsappNumber !== "—" && p.whatsappNumber !== p.mobileNumber;
              return (
                <tr key={p.id} className="border-b border-border align-middle last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-3.5">
                    <PhotoThumbnail provider={p} />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="whitespace-nowrap font-semibold text-foreground">{p.fullName}</p>
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
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === "pending" && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleApprove(p.id)}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {busy ? "Working…" : "Approve"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            className="text-danger hover:bg-danger-soft"
                            onClick={() => setRejectingId(p.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                      <ActionsMenu
                        onView={() => setViewingId(p.id)}
                        onEdit={() => setEditingId(p.id)}
                        onDelete={() => setDeletingId(p.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
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
      )}

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
        <span>
          Showing {filtered.length} of {providers.length} providers
        </span>
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
