"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Moon, ShieldCheck, Sun } from "lucide-react";
import { NOTIFY_MUTED_KEY } from "@/components/notifications/NewProviderNotifier";
import { Card } from "@/components/ui/Card";
import { cn, displayNameFromEmail } from "@/lib/utils";

type Mode = "light" | "dark";

const options: { value: Mode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function applyTheme(mode: Mode) {
  document.documentElement.setAttribute("data-theme", mode);
  try {
    // Session only: the panel always opens in light mode.
    sessionStorage.setItem("theme", mode);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
}

export function AppearanceCard({ email }: { email: string }) {
  // Read after mount so server and client markup match.
  const [mode, setMode] = useState<Mode | null>(null);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setMode(sessionStorage.getItem("theme") === "dark" ? "dark" : "light");
        setMuted(localStorage.getItem(NOTIFY_MUTED_KEY) === "1");
      } catch {
        setMode("light");
      }
    });
  }, []);

  function choose(next: Mode) {
    setMode(next);
    applyTheme(next);
  }

  function toggleMuted() {
    const next = !muted;
    setMuted(next);
    try {
      if (next) localStorage.setItem(NOTIFY_MUTED_KEY, "1");
      else localStorage.removeItem(NOTIFY_MUTED_KEY);
    } catch {
      // Not persisted; still applies for this page view.
    }
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
      <p className="mt-0.5 text-xs text-muted">The panel opens in light mode. Dark lasts until you close this tab.</p>

      <div role="radiogroup" aria-label="Theme" className="mt-4 grid grid-cols-2 gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => choose(value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl py-3.5 text-xs font-medium ring-1 transition active:scale-95",
              mode === value
                ? "bg-primary-soft text-primary ring-2 ring-primary"
                : "bg-surface-2 text-muted ring-border hover:text-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3.5 rounded-xl bg-surface-2 p-3.5 ring-1 ring-border">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
          {displayNameFromEmail(email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{displayNameFromEmail(email)}</p>
          <p className="truncate text-xs text-muted">{email}</p>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[11px] font-semibold text-success">
          <ShieldCheck className="h-3 w-3" /> Admin
        </span>
      </div>

      <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl bg-surface-2 px-3.5 py-3 ring-1 ring-border">
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            {muted ? <BellOff className="h-[18px] w-[18px]" /> : <Bell className="h-[18px] w-[18px]" />}
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">Play a sound</span>
            <span className="block text-xs text-muted">New provider alert. Popup and bell count still show while muted.</span>
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={!muted}
          aria-label="Play a sound for new providers"
          onClick={toggleMuted}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${!muted ? "bg-success-solid" : "bg-border"}`}
        >
          <span
            className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${!muted ? "translate-x-[22px]" : "translate-x-0.5"}`}
          />
        </button>
      </label>
    </Card>
  );
}
