"use client";

import { useEffect } from "react";

// A page restored from the browser's back/forward cache skips the server, so it
// would still show signed-in content after logout. Reloading re-runs the checks.
export function SessionGuard() {
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  return null;
}
