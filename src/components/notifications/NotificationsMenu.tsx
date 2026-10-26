"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { NEW_PROVIDER_EVENT } from "@/components/notifications/NewProviderNotifier";
import { ShimmerImage } from "@/components/ui/ShimmerImage";
import { stageForStatus } from "@/lib/provider-stages";
import { cn, initials, timeAgo } from "@/lib/utils";
import { useNotifications, type NotificationItem } from "@/store/NotificationsContext";

export function NotificationsMenu() {
  const router = useRouter();
  const { items, unreadCount, isUnread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [ringKey, setRingKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const wrapRef = useRef<HTMLDivElement>(null);

  // Ring the bell whenever the notifier reports a new registration.
  useEffect(() => {
    const ring = () => setRingKey((k) => k + 1);
    window.addEventListener(NEW_PROVIDER_EVENT, ring);
    return () => window.removeEventListener(NEW_PROVIDER_EVENT, ring);
  }, []);

  // Keep "2 min ago" labels fresh while the panel is open.
  useEffect(() => {
    if (!open) return;
    const tick = () => setNow(Date.now());
    queueMicrotask(tick);
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openItem(item: NotificationItem) {
    markRead(item.id);
    setOpen(false);
    router.push(`/providers/${stageForStatus(item.applicationStatus)?.slug ?? "new"}/${item.id}`);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-surface-3 hover:text-foreground",
          open ? "bg-surface-3 text-foreground" : "text-muted",
        )}
      >
        <Bell key={ringKey} className={cn("h-[18px] w-[18px]", ringKey > 0 && "animate-bell")} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 animate-pop-in items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface-2">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,390px)] origin-top-right animate-pop-in overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary-soft disabled:text-subtle disabled:hover:bg-transparent"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-3 text-subtle">
                  <BellOff className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-foreground">No notifications yet</p>
                <p className="text-xs text-muted">New provider registrations will show up here.</p>
              </div>
            ) : (
              <ul>
                {items.map((item) => {
                  const unread = isUnread(item);
                  const place = [item.city, item.state].filter(Boolean).join(", ");
                  return (
                    <li key={item.id} className="border-b border-border last:border-0">
                      <button
                        onClick={() => openItem(item)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2",
                          unread && "bg-primary-soft/40",
                        )}
                      >
                        {item.imageUrl ? (
                          <ShimmerImage
                            src={item.imageUrl}
                            alt=""
                            wrapperClassName="h-10 w-10 shrink-0 rounded-full ring-1 ring-border"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                            {initials(item.fullName)}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm text-foreground", unread ? "font-semibold" : "font-medium")}>
                            New provider registered
                          </p>
                          <p className="truncate text-sm text-fg-2">{item.fullName}</p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {[place, timeAgo(item.createdAt, now)].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        {unread ? (
                          <span
                            aria-label="Unread"
                            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15"
                          />
                        ) : (
                          <span className="mt-0.5 shrink-0 text-[11px] font-medium text-subtle">Read</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
