"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
