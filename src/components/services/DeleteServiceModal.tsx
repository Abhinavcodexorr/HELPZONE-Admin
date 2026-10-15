"use client";

import { useState } from "react";
import { AlertTriangle, Ban, X } from "lucide-react";
import type { Service } from "@/types";
import { Button } from "@/components/ui/Button";

/** Deleting a service providers still use is refused by the backend, so offer deactivation instead. */
export function DeleteServiceModal({
  service,
  onCancel,
  onConfirm,
  onDeactivate,
}: {
  service: Service;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  onDeactivate: () => Promise<void>;
}) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inUse = service.providerCount > 0;

  async function run(action: () => Promise<void>) {
    setWorking(true);
    setError(null);
    try {
      await action();
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

        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${inUse ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger"}`}
        >
          {inUse ? <Ban className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </span>

        {inUse ? (
          <>
            <h3 className="mt-3 text-base font-semibold text-foreground">Can&apos;t delete this service</h3>
            <p className="mt-1 text-sm text-muted">
              <span className="font-medium text-fg-2">{service.name}</span> is used by {service.providerCount}{" "}
              {service.providerCount === 1 ? "provider" : "providers"}. Deactivate it to hide it from the apps
              without breaking their profiles.
            </p>
          </>
        ) : (
          <>
            <h3 className="mt-3 text-base font-semibold text-foreground">Delete this service?</h3>
            <p className="mt-1 text-sm text-muted">
              This permanently removes <span className="font-medium text-fg-2">{service.name}</span>. No provider uses
              it. This can&apos;t be undone.
            </p>
          </>
        )}

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={working}>
            Cancel
          </Button>
          {inUse ? (
            service.isActive && (
              <Button onClick={() => run(onDeactivate)} disabled={working}>
                {working ? "Deactivating…" : "Deactivate instead"}
              </Button>
            )
          ) : (
            <Button variant="danger" onClick={() => run(onConfirm)} disabled={working}>
              {working ? "Deleting…" : "Delete"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
