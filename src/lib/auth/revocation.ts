// Signed cookies can't be "taken back", so signed-out session ids are remembered
// here until they would have expired anyway. Held on globalThis so every route
// in the one Node process sees the same list. It's cleared when the server
// restarts; rotating AUTH_SECRET invalidates every session regardless.
const g = globalThis as typeof globalThis & {
  __hzRevokedSessions?: Map<string, number>;
  __hzSessionGenerations?: Map<string, number>;
};
const revoked = (g.__hzRevokedSessions ??= new Map<string, number>());
// email -> this admin's current "session generation". Every token embeds the
// generation that was current when it was issued; "sign out everywhere" (and
// a password change) bumps the counter, so any token stamped with an older
// generation is rejected, with no need to track every sid ever issued. A plain
// in-memory counter also has no race window the way a seconds-resolution
// timestamp cutoff would (an old and a brand-new token minted in the same
// second would otherwise be indistinguishable). Cleared on restart, same as
// the sid list above.
const generations = (g.__hzSessionGenerations ??= new Map<string, number>());

export function revokeSession(sid: string, expiresAtSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  for (const [id, exp] of revoked) if (exp < now) revoked.delete(id);
  revoked.set(sid, expiresAtSeconds);
}

export function isRevoked(sid: string): boolean {
  const exp = revoked.get(sid);
  if (exp === undefined) return false;
  if (exp < Math.floor(Date.now() / 1000)) {
    revoked.delete(sid);
    return false;
  }
  return true;
}

export function currentGeneration(email: string): number {
  return generations.get(email) ?? 0;
}

// Invalidates every session for this admin issued so far. A session minted
// right after this call (even in the same request) reads the bumped value via
// currentGeneration() and so stays valid.
export function bumpGeneration(email: string): number {
  const next = currentGeneration(email) + 1;
  generations.set(email, next);
  return next;
}

export function isStaleGeneration(email: string, tokenGeneration: number): boolean {
  return tokenGeneration < currentGeneration(email);
}
