"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ProviderStatus } from "@/types";

export interface NotificationItem {
  id: string;
  fullName: string;
  city?: string;
  state?: string;
  imageUrl?: string;
  applicationStatus: ProviderStatus;
  createdAt: string;
}

interface NotificationsContextValue {
  items: NotificationItem[];
  setItems: (items: NotificationItem[]) => void;
  unreadCount: number;
  isUnread: (item: NotificationItem) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const STORAGE_KEY = "hz_read_notifications";
const MAX_STORED = 200;

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/**
 * One notification per recent registration. It is unread while the provider is
 * still a New Request and hasn't been opened; once someone verifies, approves
 * or rejects it (or opens it from here) it counts as read. Read ids are kept in
 * this browser so they survive reloads.
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        if (Array.isArray(saved)) setReadIds(saved.filter((id): id is string => typeof id === "string"));
      } catch {
        // Storage blocked or corrupt: start with everything unread.
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds.slice(-MAX_STORED)));
    } catch {
      // Not persisted; still works for this page view.
    }
  }, [readIds, loaded]);

  const isUnread = useCallback(
    (item: NotificationItem) => item.applicationStatus === "pending" && !readIds.includes(item.id),
    [readIds],
  );

  const markRead = useCallback(
    (id: string) => setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [],
  );

  const markAllRead = useCallback(
    () =>
      setReadIds((prev) => {
        const next = new Set(prev);
        items.forEach((item) => next.add(item.id));
        return [...next];
      }),
    [items],
  );

  const unreadCount = useMemo(() => items.filter(isUnread).length, [items, isUnread]);

  const value = useMemo(
    () => ({ items, setItems, unreadCount, isUnread, markRead, markAllRead }),
    [items, unreadCount, isUnread, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
