// Server-only helper. Never import this from a "use client" component — it
// carries the admin secret key, which must never reach the browser bundle.
import { getSession } from "@/lib/auth/guard";

const BACKEND_API_URL = (process.env.BACKEND_API_URL || "http://65.1.116.194:5000").replace(/\/$/, "");
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

export interface BackendResponse<T = unknown> {
  status: number;
  data: T;
}

export async function backendFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<BackendResponse<T>> {
  // Every call runs inside the country the signed-in admin selected, so all data is that country's.
  const session = await getSession();
  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      "x-admin-key": ADMIN_API_KEY,
      ...(session?.country ? { "x-admin-country": session.country } : {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({ success: false, message: "Invalid response from backend" }));
  return { status: response.status, data: data as T };
}
