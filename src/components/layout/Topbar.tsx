"use client";

import { useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar({ onMenuClick, userName }: { onMenuClick: () => void; userName: string }) {
  // Computed after mount so server and client markup match.
  const [today, setToday] = useState("");
  useEffect(() => {
    queueMicrotask(() =>
      setToday(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })),
    );
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/85 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-3 hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden sm:block">
        <p className="text-sm text-muted">
          Welcome back, <span className="font-semibold text-foreground">{userName}</span>
          {today && <span className="animate-fade-in text-subtle"> &middot; {today}</span>}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
