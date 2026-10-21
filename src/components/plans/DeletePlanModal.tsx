"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { Plan } from "@/types";
import { Button } from "@/components/ui/Button";

export function DeletePlanModal({
  plan,
  onCancel,
  onConfirm,
}: {
  plan: Plan;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setWorking(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setWorking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={working ? undefined : onCancel} />
      <div className="relative w-full max-w-sm animate-pop-in rounded-2xl bg-surface p-6 shadow-xl">
        <button
          onClick={onCancel}
          disabled={working}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1 text-subtle hover:bg-surface-3 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <AlertTriangle className="h-5 w-5" />
        </span>

        <h3 className="mt-3 text-base font-semibold text-foreground">Delete this plan?</h3>
        <p className="mt-1 text-sm text-muted">
          This permanently removes <span className="font-medium text-fg-2">{plan.name}</span> from the pricing page.
          Customers who already purchased it keep their access — this only stops new purchases. This can&apos;t be
          undone.
        </p>

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={working}>
            Cancel
          </Button>
          <Button variant="danger" onClick={run} disabled={working}>
            {working ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
