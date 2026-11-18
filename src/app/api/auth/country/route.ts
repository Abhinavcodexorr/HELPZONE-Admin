import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";
import { SESSION_COOKIE, withCountry } from "@/lib/auth/session";

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
  if (!country || !session.countries.includes(country)) return fail("You don't have access to that country.", 403);

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
