import { headers } from "next/headers";

const BACKEND_API_URL = (process.env.BACKEND_API_URL || "http://65.1.116.194:5000").replace(/\/$/, "");
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

export type AuthEvent =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.sign_out_everywhere"
  | "auth.country_switch"
  | "auth.password_changed"
  | "auth.session_revoked";

export interface AuthEventInput {
  type: AuthEvent;
  email: string;
  name?: string;
  role?: string;
  source?: string;
  adminId?: string;
  country?: string | null;
  success?: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

/** Records a sign-in / sign-out style event in the backend's audit log. Never throws or blocks the action. */
export async function logAuthEvent(event: AuthEventInput): Promise<void> {
  try {
    const h = await headers();
    await fetch(`${BACKEND_API_URL}/api/v1/admin/audit/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_API_KEY },
      body: JSON.stringify({
        ...event,
        ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined,
        userAgent: h.get("user-agent") || undefined,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Logging must never get in the way of signing in or out.
  }
}
