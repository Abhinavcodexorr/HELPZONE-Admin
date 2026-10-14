import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { clearFailures, isLimited, recordFailure } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken } from "@/lib/auth/session";

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

const sameText = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export async function POST(req: NextRequest) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.AUTH_SECRET;
  if (!email || !passwordHash || !secret) {
    console.error("[auth] ADMIN_EMAIL, ADMIN_PASSWORD_HASH and AUTH_SECRET must all be set.");
    return fail("Sign-in isn't configured on the server yet.", 500);
  }

  const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isLimited(clientKey)) {
    return fail("Too many failed attempts. Please wait a few minutes and try again.", 429);
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.", 400);
  }
  if (typeof body.email !== "string" || typeof body.password !== "string" || body.email.length > 254 || body.password.length > 256) {
    return fail("Enter your email and password.", 400);
  }

  // Always run the password check so timing doesn't reveal whether the email was right.
  const passwordOk = await verifyPassword(body.password, passwordHash);
  const emailOk = sameText(body.email.trim().toLowerCase(), email);
  if (!passwordOk || !emailOk) {
    recordFailure(clientKey);
    return fail("Invalid email or password.", 401);
  }

  clearFailures(clientKey);
  const secure = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const res = NextResponse.json({ success: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: await createSessionToken(email, secret),
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
