"use client";

import { useState } from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function SignOutEverywhereCard() {
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/sign-out-everywhere", { method: "POST", signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error("Couldn't sign out. Check your connection and try again.");
      try {
        sessionStorage.clear();
        // Preferences, not session data, so they survive sign-out.
        const keep = ["theme", "hz_read_notifications", "hz_notify_muted", "hz_sidebar_collapsed"].map(
          (key) => [key, localStorage.getItem(key)] as const,
        );
        localStorage.clear();
        keep.forEach(([key, value]) => {
          if (value) localStorage.setItem(key, value);
        });
      } catch {
        // Storage can be blocked; the session is already revoked server-side.
      }
      window.location.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setWorking(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <ShieldAlert className="h-[18px] w-[18px]" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground">Sign out everywhere</h2>
            <p className="text-xs text-muted sm:truncate">
              {confirming ? (
                <span className="font-medium text-danger">Sign out of every device? This can&apos;t be undone.</span>
              ) : (
                "Ends every signed-in session on every device, including this one."
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          {confirming ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={working}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirm} disabled={working}>
                <LogOut className="h-3.5 w-3.5" /> {working ? "Signing out…" : "Confirm"}
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
              <LogOut className="h-3.5 w-3.5" /> Sign out everywhere
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}
    </Card>
  );
}
