import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { isLimited, recordFailure, clearFailures } from "@/lib/auth/rate-limit";
import { bumpGeneration, revokeSession } from "@/lib/auth/revocation";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken } from "@/lib/auth/session";
import { setEnvLocalValue } from "@/lib/server/env-file";

const fail = (message: string, status: number) => NextResponse.json({ success: false, message }, { status });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return fail("Not authenticated", 401);

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.AUTH_SECRET;
  if (!passwordHash || !secret) return fail("Sign-in isn't configured on the server yet.", 500);

  // Keyed by session, not IP: an admin brute-forcing their own current
  // password shouldn't be able to lock out the shared /login rate limit.
  const limitKey = `change-password:${session.sid}`;
  if (isLimited(limitKey)) {
    return fail("Too many attempts. Please wait a few minutes and try again.", 429);
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.", 400);
  }
  const { currentPassword, newPassword } = body;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return fail("Enter your current and new password.", 400);
  }
  if (newPassword.length < 8 || newPassword.length > 256) {
    return fail("New password must be at least 8 characters.", 400);
  }

  const currentOk = await verifyPassword(currentPassword, passwordHash);
  if (!currentOk) {
    recordFailure(limitKey);
    return fail("Current password is incorrect.", 401);
  }
  if (currentPassword === newPassword) {
    return fail("New password must be different from your current password.", 400);
  }
  clearFailures(limitKey);

  const newHash = await hashPassword(newPassword);
  process.env.ADMIN_PASSWORD_HASH = newHash;
  const persisted = await setEnvLocalValue("ADMIN_PASSWORD_HASH", newHash);

  // Every session — on this device and any other — is signed out, then this
  // device is immediately issued a fresh one so the admin isn't logged out.
  bumpGeneration(session.email);
  revokeSession(session.sid, session.exp);

  const secure = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const res = NextResponse.json({
    success: true,
    message: persisted
      ? "Password changed. You're still signed in on this device."
      : "Password changed for this running server, but it has no .env.local to persist it — set ADMIN_PASSWORD_HASH there (or in your deployment's env) before the next restart, or this change is lost.",
    persisted,
  });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: await createSessionToken(session.email, secret),
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
