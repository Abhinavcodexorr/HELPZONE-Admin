import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";
import { SESSION_COOKIE, withCountry } from "@/lib/auth/session";
import { fetchAccess } from "@/lib/server/identity";
import { logAuthEvent } from "@/lib/server/audit-event";

const fail = (message: string, status: number) => NextResponse.json({ success: false, message }, { status });

// Choose (or switch) the country this admin is working in. Only a country their account allows.
export async function POST(req: NextRequest) {
  const session = await getSession();
  const secret = process.env.AUTH_SECRET;
  if (!session || !secret) return fail("Not authenticated", 401);

  let body: { country?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.", 400);
  }
  const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "";
  // Checked against what the admin may use right now, not what they could at sign-in.
  const access = await fetchAccess(session);
  if (!access) return fail("Not authenticated", 401);
  if (!country || !access.countries.includes(country)) return fail("You don't have access to that country.", 403);
  if (country !== session.country) {
    await logAuthEvent({ type: "auth.country_switch", email: session.email, name: session.name, role: session.role, source: session.src, adminId: session.adminId, country, details: { from: session.country, to: country } });
  }

  const secure = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const res = NextResponse.json({ success: true, country });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: await withCountry(session, country, secret),
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: Math.max(60, session.exp - Math.floor(Date.now() / 1000)),
  });
  return res;
}
