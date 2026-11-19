import { NextResponse } from "next/server";
import { getSession, requireSession } from "@/lib/auth/guard";
import { fetchAllCountries } from "@/lib/server/countries";
import { fetchAccess } from "@/lib/server/identity";

// Cheap liveness check for the session cookie plus who is signed in and which country they work in.
// Polled by SessionGuard so an open tab notices "sign out everywhere" (or a plain expiry) within
// seconds, without the admin having to know to clear cookies.
export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

  // Fresh rights: null means the account was disabled or removed, so this tab is signed out.
  const access = await fetchAccess(session);
  if (!access) return NextResponse.json({ success: false, message: "This account is disabled." }, { status: 401 });

  const countries = (await fetchAllCountries().catch(() => [])).filter((c) => access.countries.includes(c.code));
  return NextResponse.json(
    {
      success: true,
      user: { email: session.email, name: session.name, role: session.role },
      country: session.country,
      // False when the country this tab works in was taken away from the admin.
      countryOk: !session.country || access.countries.includes(session.country),
      countries,
      access: { permissions: access.permissions, template: access.template },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
