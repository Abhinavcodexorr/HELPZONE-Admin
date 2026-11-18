import { NextResponse } from "next/server";
import { getSession, requireSession } from "@/lib/auth/guard";
import { fetchAllCountries } from "@/lib/server/countries";

// Cheap liveness check for the session cookie plus who is signed in and which country they work in.
// Polled by SessionGuard so an open tab notices "sign out everywhere" (or a plain expiry) within
// seconds, without the admin having to know to clear cookies.
export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;
  const session = await getSession();
  const countries = session ? (await fetchAllCountries().catch(() => [])).filter((c) => session.countries.includes(c.code)) : [];
  return NextResponse.json(
    {
      success: true,
      user: session ? { email: session.email, name: session.name, role: session.role } : null,
      country: session?.country ?? null,
      countries,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
