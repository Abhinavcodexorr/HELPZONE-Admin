import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/lib/auth/revocation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  // Revoke the session on the server too, so a copied cookie stops working.
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, process.env.AUTH_SECRET);
  if (session) revokeSession(session.sid, session.exp);

  const secure = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const res = NextResponse.json({ success: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  // Cached copies of signed-in pages must not outlive the session. Only "cache" is
  // listed: "cookies"/"storage" would also wipe other apps on the same host.
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Clear-Site-Data", '"cache"');
  return res;
}
