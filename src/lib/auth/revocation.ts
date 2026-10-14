// Signed cookies can't be "taken back", so signed-out session ids are remembered
// here until they would have expired anyway. Held on globalThis so every route
// in the one Node process sees the same list. It's cleared when the server
// restarts; rotating AUTH_SECRET invalidates every session regardless.
const g = globalThis as typeof globalThis & { __hzRevokedSessions?: Map<string, number> };
const revoked = (g.__hzRevokedSessions ??= new Map<string, number>());

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
