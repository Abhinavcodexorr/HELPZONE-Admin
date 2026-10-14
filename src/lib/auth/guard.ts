import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isRevoked } from "./revocation";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./session";

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, process.env.AUTH_SECRET);
  return session && !isRevoked(session.sid) ? session : null;
}

// Route handlers call this first; proxy.ts alone is only an optimistic filter.
export async function requireSession(): Promise<NextResponse | null> {
  if (await getSession()) return null;
  return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
}
