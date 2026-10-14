// Runtime-agnostic (Web Crypto only) so the proxy and route handlers share it.

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

export interface Session {
  email: string;
  // Unique per login, so a signed-out session can be revoked server-side.
  sid: string;
  exp: number;
}

export async function createSessionToken(email: string, secret: string): Promise<string> {
  const payload = toBase64Url(
    encoder.encode(
      JSON.stringify({ email, sid: crypto.randomUUID(), exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }),
    ),
  );
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret, "sign"), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
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

    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { email?: unknown; sid?: unknown; exp?: unknown };
    if (typeof data.email !== "string" || typeof data.sid !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: data.email, sid: data.sid, exp: data.exp };
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
