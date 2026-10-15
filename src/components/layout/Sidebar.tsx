"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, HardHat, Wrench, Settings, LogOut, Loader2 } from "lucide-react";
import { cn, displayNameFromEmail } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/lib/auth/client";
import { providerStages } from "@/lib/provider-stages";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/providers", label: "Providers", icon: HardHat },
  { href: "/users", label: "Users", icon: Users },
  { href: "/services", label: "Services", icon: Wrench },
];

export function Sidebar({ onNavigate, userEmail }: { onNavigate?: () => void; userEmail: string }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [providersOpen, setProvidersOpen] = useState(true);
  const userName = displayNameFromEmail(userEmail);

  const [signOutFailed, setSignOutFailed] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutFailed(false);
    const ok = await signOut();
    if (!ok) {
      setSigningOut(false);
      setSignOutFailed(true);
    }
  }
  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="px-5 pb-5 pt-6">
        <Link href="/dashboard" onClick={onNavigate} aria-label="Help Zone dashboard" className="inline-block">
          <Logo className="h-12 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-1">
        <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Menu
        </p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const isProviders = href === "/providers";
          return (
            <div key={href}>
              <Link
                href={isProviders ? "/providers/new" : href}
                onClick={(e) => {
                  if (!isProviders) return onNavigate?.();
                  // Inside the Providers section the row toggles the stage list;
                  // from anywhere else it navigates and opens it.
                  if (active) {
                    e.preventDefault();
                    setProvidersOpen((open) => !open);
                  } else {
                    setProvidersOpen(true);
                    onNavigate?.();
                  }
                }}
                aria-expanded={isProviders ? providersOpen : undefined}
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

              {isProviders && providersOpen && (
                <div className="ml-[22px] mt-1 animate-fade-in space-y-0.5 border-l border-border pl-3">
                  {providerStages.map(({ slug, label: stageLabel, icon: StageIcon }) => {
                    const stageActive = pathname === `/providers/${slug}`;
                    return (
                      <Link
                        key={slug}
                        href={`/providers/${slug}`}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                          stageActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-sidebar-fg hover:bg-sidebar-hover hover:text-foreground"
                        )}
                      >
                        <StageIcon className="h-4 w-4" />
                        {stageLabel}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border px-3 py-3">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-primary-soft text-primary"
              : "text-sidebar-fg hover:bg-sidebar-hover hover:text-foreground"
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{userName}</p>
            <p className="truncate text-xs text-muted" title={userEmail}>
              {userEmail}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger active:scale-90 disabled:opacity-60"
          >
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          </button>
        </div>
        {signOutFailed && (
          <p role="alert" className="animate-fade-in px-1 text-xs text-danger">
            Couldn&apos;t sign out. Check your connection and try again.
          </p>
        )}
      </div>
    </div>
  );
}
