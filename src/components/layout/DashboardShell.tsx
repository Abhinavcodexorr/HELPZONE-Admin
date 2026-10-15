"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn, displayNameFromEmail } from "@/lib/utils";

const COLLAPSE_KEY = "hz_sidebar_collapsed";

export function DashboardShell({ children, userEmail }: { children: React.ReactNode; userEmail: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Starts expanded so server and first-paint markup match; a saved
  // "collapsed" preference applies right after mount (a brief flash,
  // acceptable for a layout-only preference with no visible sign-in content).
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
      } catch {
        // Default to expanded.
      }
    });
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        if (next) localStorage.setItem(COLLAPSE_KEY, "1");
        else localStorage.removeItem(COLLAPSE_KEY);
      } catch {
        // Not persisted; still applies for this page view.
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="relative hidden lg:block">
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 transition-[width] duration-200",
            collapsed ? "w-[76px]" : "w-64"
          )}
        >
          <Sidebar userEmail={userEmail} collapsed={collapsed} />
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition hover:text-foreground active:scale-90"
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-200", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 animate-slide-in-left">
            <div className="relative h-full">
              <Sidebar userEmail={userEmail} onNavigate={() => setMobileOpen(false)} />
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-[-44px] top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex min-h-screen w-full flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-[76px]" : "lg:pl-64"
        )}
      >
        <Topbar userName={displayNameFromEmail(userEmail)} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
