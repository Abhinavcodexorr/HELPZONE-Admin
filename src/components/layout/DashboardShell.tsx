"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { displayNameFromEmail } from "@/lib/utils";

export function DashboardShell({ children, userEmail }: { children: React.ReactNode; userEmail: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 z-40">
          <Sidebar userEmail={userEmail} />
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

      <div className="flex min-h-screen w-full flex-col lg:pl-64">
        <Topbar userName={displayNameFromEmail(userEmail)} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
