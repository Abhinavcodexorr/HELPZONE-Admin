import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { clearFailures, isLimited, recordFailure } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, type SessionIdentity } from "@/lib/auth/session";
import { backendFetch } from "@/lib/server/backend";
import { fetchActiveCountries } from "@/lib/server/countries";
import { displayNameFromEmail } from "@/lib/utils";

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

const sameText = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

interface BackendAdmin {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "subadmin";
  countries: string[];
}

export async function POST(req: NextRequest) {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("[auth] AUTH_SECRET must be set.");
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
  const email = body.email.trim().toLowerCase();

  let countries;
  try {
    countries = await fetchActiveCountries();
  } catch {
    return fail("Can't reach the server right now. Please try again.", 502);
  }
  const allCodes = countries.map((c) => c.code);

  let identity: SessionIdentity | null = null;

  if (envEmail && envHash && sameText(email, envEmail)) {
    // The owner account from the server's settings: a superadmin who can use every country.
    if (await verifyPassword(body.password, envHash)) {
      identity = { email: envEmail, name: displayNameFromEmail(envEmail), role: "superadmin", src: "env", countries: allCodes, country: null };
    }
  } else {
    // An admin created in the Admins page.
    const result = await backendFetch<{ success?: boolean; message?: string; data?: BackendAdmin }>("/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: body.password }),
    }).catch(() => null);
    if (!result) return fail("Can't reach the server right now. Please try again.", 502);
    if (result.status === 403) return fail(result.data?.message || "This account has been disabled.", 403);
    if (result.status === 200 && result.data?.data) {
      const admin = result.data.data;
      identity = {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        src: "db",
        adminId: admin.id,
        // A superadmin may use every country; a subadmin only the ones they were given (and that are still active).
        countries: admin.role === "superadmin" ? allCodes : admin.countries.filter((c) => allCodes.includes(c)),
        country: null,
      };
    }
  }

  if (!identity) {
    recordFailure(clientKey);
    return fail("Invalid email or password.", 401);
  }
  if (identity.countries.length === 0) {
    return fail("No country is assigned to your account yet. Ask a superadmin to give you access.", 403);
  }

  clearFailures(clientKey);
  // One country: use it straight away. More than one: they choose on the next screen.
  if (identity.countries.length === 1) identity.country = identity.countries[0];

  const secure = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const res = NextResponse.json({ success: true, needsCountry: identity.country === null });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: await createSessionToken(identity, secret),
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
