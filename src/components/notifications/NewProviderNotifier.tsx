"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { useNotifications, type NotificationItem } from "@/store/NotificationsContext";
import { useProviders } from "@/store/ProvidersContext";

const POLL_MS = 30_000;       // base poll interval: 30 s
const MAX_BACKOFF_MS = 300_000; // max back-off cap: 5 min
const POLL_TIMEOUT_MS = 8000;
const TOAST_MS = 10000;
const MAX_TOASTS = 3;
const SOUND_SRC = "/sounds/new-provider.mp3";

export const NEW_PROVIDER_EVENT = "hz:new-provider";

type LatestProvider = NotificationItem;

interface Toast {
  id: string;
  name: string;
  place: string;
}

/**
 * Polls the backend summary every few seconds. When a provider we haven't seen
 * registers, plays the bell, pops a toast, rings the top-bar bell and silently
 * reloads the list so the new request is already in "New Request".
 */
export function NewProviderNotifier() {
  const router = useRouter();
  const { sync, requestView } = useProviders();
  const { setItems, markRead } = useNotifications();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const known = useRef<Set<string> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const syncRef = useRef(sync);
  const setItemsRef = useRef(setItems);
  useEffect(() => {
    syncRef.current = sync;
    setItemsRef.current = setItems;
  }, [sync, setItems]);

  const open = useCallback(
    (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      markRead(id);
      requestView(id);
      router.push("/providers/new");
    },
    [markRead, requestView, router],
  );

  const dismiss = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  // Browsers only allow sound after the user has interacted with the page, so
  // "prime" the audio element on the first click/key press.
  useEffect(() => {
    const el = new Audio(SOUND_SRC);
    el.preload = "auto";
    audio.current = el;

    function prime() {
      el.muted = true;
      el.play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.muted = false;
        })
        .catch(() => {
          el.muted = false;
        });
    }
    window.addEventListener("pointerdown", prime, { once: true });
    window.addEventListener("keydown", prime, { once: true });
    return () => {
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let backoff = POLL_MS;

    async function poll() {
      try {
        // A hung request must not stall the loop, so each poll gives up after a few seconds.
        const res = await fetch("/api/providers/summary", { cache: "no-store", signal: AbortSignal.timeout(POLL_TIMEOUT_MS) });
        if (res.status === 401) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- session ended, reload to sign in
          window.location.href = "/login";
          return;
        }
        if (res.status === 429) {
          // Rate-limited — exponential back-off, cap at MAX_BACKOFF_MS
          backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
          if (!stopped) timer = setTimeout(poll, backoff);
          return;
        }
        // Successful response — reset back-off
        backoff = POLL_MS;
        const json = (await res.json()) as { success?: boolean; latest?: LatestProvider[] };
        if (res.ok && json.success !== false && Array.isArray(json.latest)) handle(json.latest);
      } catch {
        // Offline or backend restarting: back off gently
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      }
      if (!stopped) timer = setTimeout(poll, backoff);
    }

    function handle(latest: LatestProvider[]) {
      setItemsRef.current(latest);
      // First response only records what already exists.
      if (known.current === null) {
        known.current = new Set(latest.map((p) => p.id));
        return;
      }
      const fresh = latest.filter((p) => !known.current!.has(p.id));
      if (fresh.length === 0) return;
      fresh.forEach((p) => known.current!.add(p.id));

      const arrivals: Toast[] = fresh
        .slice()
        .reverse()
        .map((p) => ({
          id: p.id,
          name: p.fullName,
          place: [p.city, p.state].filter(Boolean).join(", "),
        }));
      setToasts((prev) => [...arrivals, ...prev].slice(0, MAX_TOASTS));
      arrivals.forEach((t) => setTimeout(() => dismiss(t.id), TOAST_MS));

      const el = audio.current;
      if (el) {
        el.currentTime = 0;
        el.play().catch(() => {
          // Blocked until the user interacts with the page once.
        });
      }
      window.dispatchEvent(new CustomEvent(NEW_PROVIDER_EVENT, { detail: { count: fresh.length } }));
      void syncRef.current();
    }

    poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[90] flex w-[min(92vw,360px)] flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          onClick={() => open(t.id)}
          className="pointer-events-auto animate-pop-in cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-xl transition hover:border-primary/40 hover:shadow-2xl"
        >
          <div className="flex items-start gap-3 p-3.5">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Bell className="h-5 w-5 animate-bell" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-surface" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">New provider registered</p>
              <p className="truncate text-sm text-fg-2">{t.name}</p>
              {t.place && <p className="truncate text-xs text-muted">{t.place}</p>}
              <span className="mt-2 inline-block text-xs font-semibold text-primary">View details →</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss(t.id);
              }}
              aria-label="Dismiss notification"
              className="rounded-lg p-1 text-subtle transition hover:bg-surface-3 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-0.5 origin-left animate-shrink-x bg-primary" style={{ animationDuration: `${TOAST_MS}ms` }} />
        </div>
      ))}
    </div>
  );
}
