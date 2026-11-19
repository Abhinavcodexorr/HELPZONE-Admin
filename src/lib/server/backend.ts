// Server-only helper. Never import this from a "use client" component — it
// carries the admin secret key, which must never reach the browser bundle.
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/guard";
import { revokeSession } from "@/lib/auth/revocation";

const BACKEND_API_URL = (process.env.BACKEND_API_URL || "http://65.1.116.194:5000").replace(/\/$/, "");
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

export interface BackendResponse<T = unknown> {
  status: number;
  data: T;
}

export async function backendFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<BackendResponse<T>> {
  // Every call runs inside the country the signed-in admin selected, so all data is that country's.
  const session = await getSession();
  const h = await headers();
  // Who is asking, so the backend can check their rights and record what they did.
  const identity: Record<string, string> = session
    ? {
        "x-admin-email": encodeURIComponent(session.email),
        "x-admin-name": encodeURIComponent(session.name),
        "x-admin-source": session.src,
        ...(session.adminId ? { "x-admin-id": session.adminId } : {}),
        ...(session.country ? { "x-admin-country": session.country } : {}),
        ...(h.get("x-forwarded-for") ? { "x-admin-ip": h.get("x-forwarded-for")!.split(",")[0].trim() } : {}),
        ...(h.get("user-agent") ? { "x-admin-ua": h.get("user-agent")!.slice(0, 300) } : {}),
      }
    : {};
  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: { ...init.headers, "x-admin-key": ADMIN_API_KEY, ...identity },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({ success: false, message: "Invalid response from backend" }));
  // The admin was disabled or removed: end their session right away.
  if (session && response.status === 401 && (data as { code?: string }).code === "ADMIN_INACTIVE") revokeSession(session.sid, session.exp);
  return { status: response.status, data: data as T };
}
