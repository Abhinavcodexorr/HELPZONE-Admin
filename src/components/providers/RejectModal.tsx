"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

export function RejectModal({
  providerName,
  onCancel,
  onConfirm,
}: {
  providerName: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-subtle hover:bg-surface-3"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-base font-semibold text-foreground">Reject application</h3>
        <p className="mt-1 text-sm text-muted">
          Let <span className="font-medium text-fg-2">{providerName}</span> know why their
          KYC documents were rejected so they can resubmit.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="e.g. ID document image is blurred, details not legible..."
          className="mt-4 w-full rounded-lg border border-border p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>
  );
}
