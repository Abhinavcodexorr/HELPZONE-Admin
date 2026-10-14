// Browser-side sign-out: revoke the session on the server, then clear what this
// browser kept. Returns false (and stays put) if the server couldn't be reached,
// so nobody thinks they're signed out while the session is still live.
export async function signOut(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    if (!res.ok) return false;
  } catch {
    return false;
  }

  try {
    sessionStorage.clear();
    const theme = localStorage.getItem("theme");
    localStorage.clear();
    if (theme) localStorage.setItem("theme", theme);
  } catch {
    // Storage can be blocked; the session is already revoked, so carry on.
  }

  // replace() drops the signed-in page from history so Back can't return to it.
  window.location.replace("/login");
  return true;
}
