import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, safeNextPath, verifySessionToken } from "@/lib/auth/session";

// Optimistic gate: only reads the signed cookie. Route handlers re-check it too.
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Login/logout must stay reachable without a session.
  if (pathname.startsWith("/api/auth/")) return NextResponse.next();

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, process.env.AUTH_SECRET);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }
    if (pathname === "/login") return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const next = safeNextPath(pathname + search);
    if (next && next !== "/dashboard" && next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  // Signed in but no country chosen yet (an admin with several countries): they pick one first.
  if (!session.country && pathname !== "/select-country") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Choose a country first.", needsCountry: true }, { status: 409 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/select-country";
    url.search = "";
    const next = safeNextPath(pathname + search);
    if (next && next !== "/dashboard" && next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  // ?ended=1: the session was ended on the server (account disabled, signed out elsewhere); show the form.
  if (pathname === "/login" && !req.nextUrl.searchParams.has("ended")) {
    const url = req.nextUrl.clone();
    url.pathname = safeNextPath(req.nextUrl.searchParams.get("next")) ?? "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  // Skip Next internals and static assets (logo, icons).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|gif)$).*)"],
};
