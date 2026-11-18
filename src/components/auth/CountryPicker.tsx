"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { flagEmoji, type Country } from "@/lib/countries";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

/** Shown after sign-in to an admin who may work in more than one country. */
export function CountryPicker({ countries, current, next, name }: { countries: Country[]; current: string | null; next: string; name: string }) {
  const [picking, setPicking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(code: string) {
    setPicking(code);
    setError(null);
    try {
      const res = await fetch("/api/auth/country", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: code }),
      });
      if (!res.ok) throw new Error();
      window.location.assign(next);
    } catch {
      setError("Couldn't select that country. Please try again.");
      setPicking(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-surface p-7 shadow-xl ring-1 ring-border sm:p-9">
        <Logo surface="light" className="mx-auto h-10 w-auto" />
        <h1 className="mt-6 text-center text-xl font-bold text-foreground">Choose a country</h1>
        <p className="mt-1 text-center text-sm text-muted">
          Hi {name.split(" ")[0]}, which country do you want to work in? Everything you see will be for that country.
        </p>

        <div className="mt-6 space-y-3">
          {countries.map((c) => {
            const busy = picking === c.code;
            const on = current === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => choose(c.code)}
                disabled={picking !== null}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left ring-1 transition active:scale-[0.99] disabled:opacity-70",
                  on ? "bg-primary-soft ring-2 ring-primary" : "bg-surface ring-border hover:bg-surface-2 hover:ring-primary/40",
                )}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-3xl ring-1 ring-border">{flagEmoji(c.code)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-foreground">{c.name}</span>
                  <span className="block text-xs text-muted">
                    Currency: {c.currencyCode} ({c.currencySymbol})
                  </span>
                </span>
                {busy ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : on ? <Check className="h-5 w-5 text-primary" /> : null}
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">{error}</p>}

        <button type="button" onClick={() => void signOut()} className="mx-auto mt-6 block text-xs font-semibold text-muted hover:text-foreground">
          Sign out
        </button>
      </div>
    </main>
  );
}
