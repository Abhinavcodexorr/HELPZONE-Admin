import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";
import { bumpGeneration } from "@/lib/auth/revocation";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

  // Invalidates this device's session too, same as every other — the admin
  // signs back in once, everywhere, rather than only everywhere-but-here.
  bumpGeneration(session.email);

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
  res.headers.set("Cache-Control", "no-store");
  return res;
}
