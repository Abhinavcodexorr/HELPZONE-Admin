"use client";

import { useEffect } from "react";

const CHECK_MS = 8000;

// Keeps an open tab in sync with the server's idea of whether this session is
// still valid — so someone signed out remotely (e.g. "Sign out everywhere"
// clicked on another device) lands back on the login screen on their own,
// within seconds, with no need to know how to clear cookies themselves.
export function SessionGuard() {
  useEffect(() => {
    // A page restored from the browser's back/forward cache skips the server,
    // so it would still show signed-in content after logout. Reloading re-runs
    // the checks (including proxy.ts, which redirects if the session is gone).
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);

    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function check() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store", signal: AbortSignal.timeout(6000) });
        if (res.status === 401) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- session ended elsewhere, reload to sign in
          window.location.href = "/login";
          return;
        }
      } catch {
        // Offline or the server's restarting: try again next tick, don't sign anyone out for that.
      }
      if (!stopped) timer = setTimeout(check, CHECK_MS);
    }

    // Also check right when the tab becomes visible again, so switching back
    // after a while catches up immediately instead of waiting for the next tick.
    function onVisible() {
      if (document.visibilityState === "visible") check();
    }
    document.addEventListener("visibilitychange", onVisible);

    timer = setTimeout(check, CHECK_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
