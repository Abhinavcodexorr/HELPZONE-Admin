"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
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

  const categories = useMemo(
    () => Array.from(new Set(providers.map((p) => p.category))).sort(),
    [providers]
  );

  const handleApprove = (id: string) => {
    setActionError(null);
    approve(id).catch((err) => setActionError(err instanceof Error ? err.message : "Failed to approve provider"));
  };

  const handleReject = (id: string, reason: string) => {
    setActionError(null);
    reject(id, reason).catch((err) => setActionError(err instanceof Error ? err.message : "Failed to reject provider"));
  };

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
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    status === t.value ? "bg-white/20" : "bg-white text-gray-500"
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
        <div className="border-b border-border bg-rose-50 px-4 py-2 text-xs text-rose-700">{actionError}</div>
      )}

      {error && (
        <div className="flex items-center justify-between border-b border-border bg-rose-50 px-4 py-2 text-xs text-rose-700">
          <span>{error}</span>
          <button onClick={refresh} className="font-medium underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="px-4 py-10 text-center text-sm text-gray-400">Loading providers…</div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1140px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Photo</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Experience</th>
              <th className="px-4 py-3 font-medium">ID Proof</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.fullName} color={p.avatarColor} />
                    <div>
                      <p className="font-medium text-gray-900">{p.fullName}</p>
                      <p className="text-xs text-gray-400">
                        {p.id} &middot; {formatDate(p.submittedAt)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PhotoThumbnail provider={p} />
                </td>
                <td className="px-4 py-3">
                  <Badge tone="indigo">{p.category}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {p.area}
                  <p className="text-xs text-gray-400">{p.city}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700">{p.mobileNumber}</p>
                  <p className="truncate text-xs text-gray-400">{p.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {p.experienceYears} {p.experienceYears === 1 ? "yr" : "yrs"}
                </td>
                <td className="px-4 py-3">
                  <IdProofThumbnail provider={p} />
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <ActionsMenu
                    canApprove={p.status === "pending"}
                    onView={() => setViewingId(p.id)}
                    onApprove={() => handleApprove(p.id)}
                    onReject={() => setRejectingId(p.id)}
                    onEdit={() => setEditingId(p.id)}
                    onDelete={() => setDeletingId(p.id)}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                  No providers match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-gray-500">
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
