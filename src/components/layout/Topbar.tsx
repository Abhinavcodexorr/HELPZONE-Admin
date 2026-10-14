"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CalendarDays, Menu, Moon, Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import { useProviders } from "@/store/ProvidersContext";
import { ThemeToggle } from "./ThemeToggle";

function greetingFor(date: Date | null): { text: string; Icon: LucideIcon } {
  const hour = date?.getHours() ?? 12;
  if (hour < 5) return { text: "Good night", Icon: Moon };
  if (hour < 12) return { text: "Good morning", Icon: Sunrise };
  if (hour < 17) return { text: "Good afternoon", Icon: Sun };
  if (hour < 21) return { text: "Good evening", Icon: Sunset };
  return { text: "Good night", Icon: Moon };
}

export function Topbar({ onMenuClick, userName }: { onMenuClick: () => void; userName: string }) {
  // Computed after mount so server and client markup match; ticks every second.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    queueMicrotask(tick);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const { providers } = useProviders();
  const pending = providers.filter((p) => p.status === "pending").length;

  const date = now?.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const [clock, period] = (
    now?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) ?? ""
  ).split(" ");
  const { text: greeting, Icon: GreetingIcon } = greetingFor(now);

  return (
    <header className="sticky top-0 z-30 grid h-[68px] grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-3 hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary ring-1 ring-primary/15">
            <GreetingIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs text-muted">{greeting}</p>
            <p className="truncate text-[15px] font-semibold text-foreground">{userName}</p>
          </div>
        </div>
      </div>

      <div className="hidden justify-self-center md:block">
        <div className="flex items-stretch overflow-hidden rounded-xl bg-surface-2 ring-1 ring-border">
          <span className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-fg-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {date ?? <span className="inline-block h-3 w-28 rounded skeleton" />}
          </span>
          <span className="my-2 w-px bg-border" />
          <span className="flex items-center gap-2 px-3.5 py-2 tabular-nums">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {clock ? (
              <span className="text-sm font-semibold text-foreground">
                {clock}
                <span className="ml-1 text-[10px] font-semibold uppercase text-primary">{period}</span>
              </span>
            ) : (
              <span className="inline-block h-3.5 w-20 rounded skeleton" />
            )}
          </span>
        </div>
      </div>

      <div className="col-start-3 flex items-center justify-end gap-2">
        <div className="flex items-center gap-0.5 rounded-xl bg-surface-2 p-1 ring-1 ring-border">
          <ThemeToggle />
          <Link
            href="/providers/new"
            aria-label={pending > 0 ? `${pending} applications awaiting review` : "Notifications"}
            title={pending > 0 ? `${pending} awaiting review` : "No new applications"}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
          >
            <Bell className="h-[18px] w-[18px]" />
            {pending > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 animate-pop-in items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface-2">
                {pending > 9 ? "9+" : pending}
              </span>
            )}
          </Link>
        </div>
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm ring-2 ring-primary/20">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-surface" />
        </div>
      </div>
    </header>
  );
}
