"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { useCountry } from "@/store/CountryContext";
import { useAccess } from "@/store/AccessContext";
import { firstAllowedPath, pathAllowed } from "@/lib/permissions";

/** Shows the page only if this admin's role allows it; otherwise a clear "no access" screen. */
export function AccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, country } = useCountry();
  const { permissions } = useAccess();
  const allowed = pathAllowed(pathname, permissions, role);
  const fallback = firstAllowedPath(permissions, role);

  // Landing on the dashboard without access to it: go to the first page they can use.
  useEffect(() => {
    if (!allowed && (pathname === "/dashboard" || pathname === "/") && fallback && fallback !== pathname) router.replace(fallback);
  }, [allowed, pathname, fallback, router]);

  if (allowed) return <>{children}</>;
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <ShieldOff className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-lg font-bold text-foreground">You don&apos;t have access to this page</h1>
      <p className="mt-1.5 text-sm text-muted">
        Your role doesn&apos;t include it for {country.name}. Ask a superadmin if you need it.
      </p>
      {fallback && fallback !== pathname && (
        <Link href={fallback} className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          Go to a page you can use
        </Link>
      )}
    </div>
  );
}
