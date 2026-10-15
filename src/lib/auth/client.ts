const LOGOUT_TIMEOUT_MS = 4000;

// Browser-side sign-out: revoke the session on the server, then clear what this
// browser kept. Returns false (and stays put) if the server couldn't be reached,
// so nobody thinks they're signed out while the session is still live. Bounded
// by a short timeout so a slow network can never leave the button spinning.
export async function signOut(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      signal: AbortSignal.timeout(LOGOUT_TIMEOUT_MS),
    });
    if (!res.ok) return false;
  } catch {
    return false;
  }

  try {
    sessionStorage.clear();
    // Preferences, not session data, so they survive sign-out.
    const keep = ["theme", "hz_read_notifications", "hz_notify_muted"].map(
      (key) => [key, localStorage.getItem(key)] as const,
    );
    localStorage.clear();
    keep.forEach(([key, value]) => {
      if (value) localStorage.setItem(key, value);
    });
  } catch {
    // Storage can be blocked; the session is already revoked, so carry on.
  }

  // replace() drops the signed-in page from history so Back can't return to it.
  window.location.replace("/login");
  return true;
}
