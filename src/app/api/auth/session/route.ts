import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";

// Cheap liveness check for the session cookie — no backend call, just the
// signature/revocation/generation checks already in requireSession(). Polled
// by SessionGuard so an open tab notices "sign out everywhere" (or a plain
// expiry) within seconds, without the admin having to know to clear cookies.
export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}
