"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, HardHat, Wrench, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/providers", label: "Providers", icon: HardHat },
  { href: "/services", label: "Services", icon: Wrench },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="px-5 pb-5 pt-6">
        <div className="inline-flex rounded-xl px-1.5 py-1 dark:bg-white dark:px-3 dark:py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal.png" alt="Help Zone" className="h-8 w-auto" />
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-1">
        <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Menu
        </p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-sidebar-fg hover:bg-sidebar-hover hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border px-3 py-3">
        <Link
          href="#"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-fg transition-colors hover:bg-sidebar-hover hover:text-foreground"
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">Admin User</p>
            <p className="truncate text-xs text-muted">info.codexorr@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
