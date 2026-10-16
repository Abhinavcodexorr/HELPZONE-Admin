"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, TriangleAlert } from "lucide-react";

const inputClass =
  "login-input peer w-full rounded-2xl border-2 border-[#b7c3e0] bg-white py-3.5 pl-[3.6rem] pr-4 text-[15px] font-medium text-black caret-black placeholder:font-normal placeholder:text-[#9aa7c7] shadow-[0_1px_0_rgba(255,255,255,0.9),inset_0_1px_3px_rgba(30,60,150,0.07)] outline-none transition focus:border-[#2f5be0] focus:ring-4 focus:ring-[#2f5be0]/15";

// Icon chip that sits inside the field and turns solid blue while it has focus.
const chipClass =
  "pointer-events-none absolute left-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#e8efff] text-[#4a6fd8] transition-colors duration-200 peer-focus:bg-[#2f5be0] peer-focus:text-white";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5b6a94]">
          Email
        </label>
        <div className="relative">
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
          <span className={chipClass}>
            <Mail className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5b6a94]">
          Password
        </label>
        <div className="relative">
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
          <span className={chipClass}>
            <Lock className="h-4 w-4" />
          </span>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#7a89b0] transition hover:bg-[#e8efff] hover:text-[#2f5be0]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {capsLock && (
        <p className="flex animate-fade-in items-center gap-1.5 rounded-lg bg-[#e8efff] px-3 py-2 text-xs font-medium text-[#2f5be0]">
          <TriangleAlert className="h-3.5 w-3.5" /> Caps Lock is on
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="flex animate-pop-in items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-600"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="btn-blue group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-4 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-55"
      >
        {/* light sweep on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-[300%]"
        />
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
