"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, HardHat, Wrench, Award, Settings, LogOut, Loader2 } from "lucide-react";
import { cn, displayNameFromEmail } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/lib/auth/client";
import { providerStages } from "@/lib/provider-stages";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/providers", label: "Providers", icon: HardHat },
  { href: "/users", label: "Users", icon: Users },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/plans", label: "Plans", icon: Award },
];

// Shown next to a collapsed-sidebar icon on hover — same dark pill used for
// chart tooltips elsewhere, so it reads as part of the same design system.
function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
      {children}
    </span>
  );
}

export function Sidebar({
  onNavigate,
  userEmail,
  collapsed = false,
}: {
  onNavigate?: () => void;
  userEmail: string;
  /** Icon-only rail instead of the full sidebar. Ignored on the mobile slide-in overlay. */
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [providersOpen, setProvidersOpen] = useState(true);
  const [providersFlyout, setProvidersFlyout] = useState(false);
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

  const providersActive = pathname === "/providers" || pathname.startsWith("/providers/");

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-visible border-r border-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className={cn("flex items-center pb-5 pt-6", collapsed ? "justify-center px-0" : "px-5")}>
        <Link href="/dashboard" onClick={onNavigate} aria-label="Help Zone dashboard" className="group relative inline-block">
          {collapsed ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-serif text-lg font-bold italic text-primary-foreground">
              h
            </span>
          ) : (
            <Logo className="h-12 w-auto" />
          )}
          {collapsed && <Tooltip>Help Zone</Tooltip>}
        </Link>
      </div>

      <nav className={cn("flex-1 space-y-1 py-1", collapsed ? "px-2.5" : "px-3")}>
        {!collapsed && (
          <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">Menu</p>
        )}
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/providers" ? providersActive : pathname === href || pathname.startsWith(href + "/");
          const isProviders = href === "/providers";
          return (
            <div
              key={href}
              className="relative"
              onMouseEnter={() => isProviders && collapsed && setProvidersFlyout(true)}
              onMouseLeave={() => isProviders && collapsed && setProvidersFlyout(false)}
            >
              <Link
                href={isProviders ? "/providers/new" : href}
                onClick={(e) => {
                  if (!isProviders) return onNavigate?.();
                  if (collapsed) return onNavigate?.(); // let the flyout handle sub-navigation
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
                aria-expanded={isProviders && !collapsed ? providersOpen : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-0" : "px-3",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-sidebar-fg hover:bg-sidebar-hover hover:text-foreground"
                )}
              >
                {active && !collapsed && (
                  <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                {active && collapsed && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && label}
                {collapsed && <Tooltip>{label}</Tooltip>}
              </Link>

              {/* Expanded: stage list sits inline below Providers. */}
              {isProviders && !collapsed && providersOpen && (
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

              {/* Collapsed: stage list shows as a flyout on hover instead. */}
              {isProviders && collapsed && providersFlyout && (
                <div className="absolute left-full top-0 z-50 ml-3 w-48 animate-pop-in overflow-hidden rounded-xl border border-border bg-surface py-1.5 shadow-xl">
                  <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                    Providers
                  </p>
                  {providerStages.map(({ slug, label: stageLabel, icon: StageIcon }) => {
                    const stageActive = pathname === `/providers/${slug}`;
                    return (
                      <Link
                        key={slug}
                        href={`/providers/${slug}`}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors",
                          stageActive
                            ? "bg-primary-soft text-primary"
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

      <div className={cn("space-y-2 border-t border-border py-3", collapsed ? "px-2.5" : "px-3")}>
        <Link
          href="/settings"
          onClick={onNavigate}
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            pathname === "/settings"
              ? "bg-primary-soft text-primary"
              : "text-sidebar-fg hover:bg-sidebar-hover hover:text-foreground"
          )}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && "Settings"}
          {collapsed && <Tooltip>Settings</Tooltip>}
        </Link>

        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              title={userEmail}
            >
              {userName.charAt(0).toUpperCase()}
              <Tooltip>{userName}</Tooltip>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign out"
              aria-label="Sign out"
              className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger active:scale-90 disabled:opacity-60"
            >
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <Tooltip>Sign out</Tooltip>
            </button>
          </div>
        ) : (
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
        )}
        {signOutFailed && (
          <p role="alert" className="animate-fade-in px-1 text-xs text-danger">
            Couldn&apos;t sign out. Check your connection and try again.
          </p>
        )}
      </div>
    </div>
  );
}
