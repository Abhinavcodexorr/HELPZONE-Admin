"use client";

import { useState } from "react";
import { RIPPLE_EVENT } from "@/components/auth/WaterRipples";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, TriangleAlert } from "lucide-react";

const inputClass =
  "w-full rounded-2xl border border-border bg-surface-2 py-3 pl-11 pr-4 text-sm text-foreground shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] outline-none transition focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/15";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // A water wave spreads out from the Sign in button (click or Enter).
    const button = e.currentTarget.querySelector<HTMLElement>("button[type=submit]");
    if (button) {
      const rect = button.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent(RIPPLE_EVENT, { detail: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } }),
      );
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(json.message ?? "Couldn't sign you in. Please try again.");
        setLoading(false);
        return;
      }
      // Full navigation so the app loads fresh, with the new session cookie.
      window.location.assign(next);
    } catch {
      setError("Can't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-fg-2">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-fg-2">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
            onBlur={() => setCapsLock(false)}
            placeholder="Enter your password"
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-surface-3 hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {capsLock && (
        <p className="-mt-2 flex animate-fade-in items-center gap-1.5 text-xs font-medium text-warning">
          <TriangleAlert className="h-3.5 w-3.5" /> Caps Lock is on
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="flex animate-pop-in items-start gap-2.5 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="btn-jelly mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
