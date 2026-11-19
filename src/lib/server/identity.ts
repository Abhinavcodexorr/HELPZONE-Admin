import { revokeSession } from "@/lib/auth/revocation";
import type { Session } from "@/lib/auth/session";
import { backendFetch } from "@/lib/server/backend";

export interface Access {
  permissions: string[];
  template: string;
  /** Active countries this admin may use right now. */
  countries: string[];
}

interface MeResponse {
  success?: boolean;
  data?: { permissions: string[]; template: string; countries: string[] };
}

// The last good answer per admin, so a short backend hiccup doesn't lock everyone out of the page.
const lastGood = new Map<string, { at: number; access: Access }>();
const GRACE_MS = 5 * 60_000;

/**
 * What this admin may do RIGHT NOW. For an admin created in the Admins page it is read from the backend
 * (so a change of permissions or countries applies without signing in again). null = the account was
 * disabled or removed, and the session has been ended.
 */
export async function fetchAccess(session: Session): Promise<Access | null> {
  const key = session.adminId || session.email;
  const result = await backendFetch<MeResponse>("/api/v1/admin/me").catch(() => null);

  if (result?.status === 200 && result.data?.data) {
    const access = { permissions: result.data.data.permissions, template: result.data.data.template, countries: result.data.data.countries };
    lastGood.set(key, { at: Date.now(), access });
    return access;
  }
  if (result?.status === 401) return null; // disabled or removed (backendFetch already ended the session)

  const cached = lastGood.get(key);
  if (cached && Date.now() - cached.at < GRACE_MS) return cached.access;
  // Backend unreachable and nothing recent to go on: keep the owner working, give everyone else nothing.
  if (session.src === "env") return { permissions: ["*"], template: "superadmin", countries: session.countries };
  return { permissions: [], template: "none", countries: session.countries };
}

export function endSession(session: Session) {
  revokeSession(session.sid, session.exp);
}
