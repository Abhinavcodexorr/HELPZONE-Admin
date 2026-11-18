"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { flagEmoji } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { useCountry } from "@/store/CountryContext";

/** The country the admin is working in. With more than one allowed country it is a menu to switch. */
export function CountrySwitcher() {
  const { country, countries, switching, switchCountry } = useCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const canSwitch = countries.length > 1;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const pill = (
    <>
      <span className="text-lg leading-none">{flagEmoji(country.code)}</span>
      <span className="hidden text-sm font-semibold text-foreground sm:inline">{country.name}</span>
      {switching ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" /> : canSwitch ? <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition-transform", open && "rotate-180")} /> : null}
    </>
  );

  if (!canSwitch) {
    return (
      <div title={`Working in ${country.name}`} className="flex h-10 items-center gap-2 rounded-xl bg-surface-2 px-3 ring-1 ring-border">
        {pill}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={switching}
        className="flex h-10 items-center gap-2 rounded-xl bg-surface-2 px-3 ring-1 ring-border transition hover:bg-surface-3 active:scale-95"
      >
        {pill}
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 top-full z-50 mt-2 w-60 animate-fade-in overflow-hidden rounded-2xl bg-surface p-1.5 shadow-xl ring-1 ring-border">
          <li className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">Switch country</li>
          {countries.map((c) => {
            const on = c.code === country.code;
            return (
              <li key={c.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => (on ? setOpen(false) : void switchCountry(c.code))}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-2", on && "bg-primary-soft")}
                >
                  <span className="text-xl leading-none">{flagEmoji(c.code)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{c.name}</span>
                    <span className="block text-[11px] text-muted">{c.currencyCode}</span>
                  </span>
                  {on && <Check className="h-4 w-4 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
