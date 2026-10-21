"use client";

import { useState } from "react";
import { Ban, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pill, PillRow } from "@/components/ui/filters";

type Duration = "forever" | "1" | "7" | "30" | "custom";
const durations: { value: Duration; label: string }[] = [
  { value: "forever", label: "Until I unblock" },
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "custom", label: "Pick a date" },
];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

/** End of the chosen duration as an ISO string, or null for an open-ended block. */
function untilFor(duration: Duration, customDate: string): string | null {
  if (duration === "forever") return null;
  if (duration === "custom") return customDate ? new Date(`${customDate}T23:59:59`).toISOString() : null;
  return new Date(Date.now() + Number(duration) * 86_400_000).toISOString();
}

const reasons = ["Fake or spam account", "Abusive behaviour", "Payment issue", "Suspected fraud", "Requested by the user"];

/** Asks why before blocking one or several users. The reason is stored on the account. */
export function BlockUserModal({
  names,
  onCancel,
  onConfirm,
}: {
  names: string[];
  onCancel: () => void;
  onConfirm: (reason: string, until: string | null) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<Duration>("forever");
  const [customDate, setCustomDate] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const many = names.length > 1;

  async function confirm() {
    setWorking(true);
    setError(null);
    try {
      await onConfirm(reason.trim(), untilFor(duration, customDate));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't block. Try again.");
      setWorking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={working ? undefined : onCancel} />
      <div className="relative w-full max-w-md animate-pop-in rounded-2xl bg-surface p-6 shadow-xl">
        <button onClick={onCancel} disabled={working} aria-label="Close" className="absolute right-4 top-4 rounded-lg p-1 text-subtle hover:bg-surface-3 disabled:opacity-50">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <Ban className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">{many ? `Block ${names.length} customers` : "Block customer"}</h3>
            <p className="text-sm text-muted">{many ? "These accounts" : names[0]}</p>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-surface-2 px-3.5 py-3 text-xs text-muted ring-1 ring-border">
          Blocked customers can&apos;t sign in or make bookings. Their data stays, and you can unblock them any time.
        </p>

        <p className="mb-2 mt-4 text-xs font-medium text-fg-2">How long</p>
        <PillRow>
          {durations.map((d) => (
            <Pill key={d.value} active={duration === d.value} onClick={() => setDuration(d.value)}>
              {d.label}
            </Pill>
          ))}
        </PillRow>
        {duration === "custom" && (
          <input
            type="date"
            min={tomorrow()}
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        )}
        <p className="mt-1.5 text-[11px] text-subtle">
          {duration === "forever" ? "Stays blocked until you unblock them." : "They are unblocked automatically when the time is up."}
        </p>

        <p className="mb-2 mt-4 text-xs font-medium text-fg-2">
          Reason <span className="font-normal text-subtle">(optional, saved on the account)</span>
        </p>
        <PillRow>
          {reasons.map((r) => (
            <Pill key={r} active={reason === r} onClick={() => setReason(reason === r ? "" : r)}>
              {r}
            </Pill>
          ))}
        </PillRow>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 300))}
          rows={2}
          placeholder="Or write your own…"
          className="mt-3 w-full resize-none rounded-lg border border-border bg-surface p-3 text-sm text-fg-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        {error && <p className="mt-2 text-xs text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={working}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} disabled={working || (duration === "custom" && !customDate)}>
            <Ban className="h-4 w-4" /> {working ? "Blocking…" : many ? `Block ${names.length}` : "Block customer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
