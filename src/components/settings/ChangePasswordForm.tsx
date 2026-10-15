"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 pr-10 text-sm text-fg-2 placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function strengthOf(password: string): { score: number; label: string; tone: string } {
  if (!password) return { score: 0, label: "", tone: "bg-border" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  const levels = [
    { label: "Too short", tone: "bg-danger-solid" },
    { label: "Weak", tone: "bg-danger-solid" },
    { label: "Okay", tone: "bg-warning" },
    { label: "Good", tone: "bg-primary" },
    { label: "Strong", tone: "bg-success-solid" },
    { label: "Very strong", tone: "bg-success-solid" },
  ];
  return { score, ...levels[Math.min(score, levels.length - 1)] };
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-fg-2">{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={inputClass}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:bg-surface-3 hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const strength = useMemo(() => strengthOf(next), [next]);
  const mismatch = confirm.length > 0 && next !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const body = await res.json().catch(() => ({ success: false, message: "Invalid response" }));
      if (!res.ok || body.success === false) throw new Error(body.message || "Failed to change password");
      setSuccess(body.message || "Password changed.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <KeyRound className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Change password</h2>
          <p className="text-xs text-muted">Signs this device back in automatically; every other session ends.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
        <PasswordField label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
        <PasswordField label="New password" value={next} onChange={setNext} autoComplete="new-password" />

        {next && (
          <div className="flex items-center gap-2">
            <div className="flex h-1.5 flex-1 gap-1 overflow-hidden rounded-full bg-surface-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={cn("h-full flex-1 transition-colors", i < strength.score ? strength.tone : "bg-transparent")}
                />
              ))}
            </div>
            <span className="w-20 shrink-0 text-right text-[11px] font-medium text-muted">{strength.label}</span>
          </div>
        )}

        <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {mismatch && <p className="text-xs text-danger">Passwords don&apos;t match.</p>}

        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="rounded-lg bg-success-soft px-3 py-2 text-xs text-success">
            {success}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={saving || !current || next.length < 8 || mismatch}>
            {saving ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
