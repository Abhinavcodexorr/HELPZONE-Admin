"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, X } from "lucide-react";

export function DeleteConfirmModal({
  providerName,
  onCancel,
  onConfirm,
}: {
  providerName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete provider");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={deleting ? undefined : onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="absolute right-4 top-4 rounded-lg p-1 text-subtle hover:bg-surface-3 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-base font-semibold text-foreground">Delete this provider?</h3>
        <p className="mt-1 text-sm text-muted">
          This permanently removes <span className="font-medium text-fg-2">{providerName}</span>
          &apos;s application and KYC records. This can&apos;t be undone.
        </p>

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
