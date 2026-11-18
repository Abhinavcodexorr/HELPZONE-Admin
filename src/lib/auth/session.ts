// Runtime-agnostic (Web Crypto only) so the proxy and route handlers share it.

import { currentGeneration } from "./revocation";

export const SESSION_COOKIE = "hz_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function importKey(secret: string, usage: KeyUsage) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export type AdminRole = "superadmin" | "subadmin";

export interface Session {
  email: string;
  name: string;
  role: AdminRole;
  /** "env" = the owner account from the server's settings; "db" = an admin created in the Admins page. */
  src: "env" | "db";
  /** Backend admin id (db admins only). */
  adminId?: string;
  /** Country codes this admin may work in (a superadmin gets every active country at sign-in). */
  countries: string[];
  /** The country they are working in right now; null until they pick one. */
  country: string | null;
  // Unique per login, so a signed-out session can be revoked server-side.
  sid: string;
  // This admin's session generation when the token was issued. "Sign out
  // everywhere" and a password change bump the generation, which invalidates
  // every token stamped with an older one — see revocation.ts.
  gen: number;
  exp: number;
}

async function signPayload(data: object, secret: string): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(data)));
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret, "sign"), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export interface SessionIdentity {
  email: string;
  name: string;
  role: AdminRole;
  src: "env" | "db";
  adminId?: string;
  countries: string[];
  country: string | null;
}

export async function createSessionToken(identity: SessionIdentity, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return signPayload(
    { ...identity, sid: crypto.randomUUID(), gen: currentGeneration(identity.email), exp: now + SESSION_TTL_SECONDS },
    secret,
  );
}

/** Same session (same sid, same expiry) with a different working country. */
export async function withCountry(session: Session, country: string, secret: string): Promise<string> {
  return signPayload({ ...session, country }, secret);
}

export async function verifySessionToken(token: string | undefined, secret: string | undefined): Promise<Session | null> {
  if (!token || !secret) return null;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;

  try {
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify(
      "HMAC",
      await importKey(secret, "verify"),
      fromBase64Url(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;

    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      email?: unknown;
      name?: unknown;
      role?: unknown;
      src?: unknown;
      adminId?: unknown;
      countries?: unknown;
      country?: unknown;
      sid?: unknown;
      gen?: unknown;
      exp?: unknown;
    };
    if (typeof data.email !== "string" || typeof data.sid !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    // Tokens issued before this file's `gen` support (none in practice, since
    // rotating AUTH_SECRET during that rollout invalidated every old token) —
    // treat a missing generation as "older than generation zero" so it's never trusted.
    const gen = typeof data.gen === "number" ? data.gen : -1;
    // Sessions issued before countries existed were always the owner account: a superadmin who still has to pick a country.
    const role: AdminRole = data.role === "subadmin" ? "subadmin" : "superadmin";
    return {
      email: data.email,
      name: typeof data.name === "string" && data.name ? data.name : data.email,
      role,
      src: data.src === "db" ? "db" : "env",
      adminId: typeof data.adminId === "string" ? data.adminId : undefined,
      countries: Array.isArray(data.countries) ? data.countries.filter((c): c is string => typeof c === "string") : [],
      country: typeof data.country === "string" ? data.country : null,
      sid: data.sid,
      gen,
      exp: data.exp,
    };
  } catch {
    return null;
  }
}

// Only allow same-site relative paths, so ?next= can't bounce users elsewhere.
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value.startsWith("/login") || value.startsWith("/api/")) return null;
  return value;
}
