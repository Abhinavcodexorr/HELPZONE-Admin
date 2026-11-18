import { NextRequest, NextResponse } from "next/server";
import { getSession, requireSuperadmin } from "@/lib/auth/guard";
import { bumpGeneration } from "@/lib/auth/revocation";
import { backendFetch } from "@/lib/server/backend";

type Ctx = { params: Promise<{ id: string }> };
const path = (id: string) => `/api/v1/admin/admins/${encodeURIComponent(id)}`;

// Edit an admin (name, role, countries, active, new password). Their open sessions are ended so the change applies right away.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireSuperadmin();
  if (denied) return denied;
  const { id } = await params;
  const me = await getSession();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  // Nobody can lock themselves out, or take away their own superadmin role, from this screen.
  if (me?.adminId === id && (body.isActive === false || body.role === "subadmin")) {
    return NextResponse.json({ success: false, message: "You can't disable or demote your own account." }, { status: 400 });
  }
  const { status, data } = await backendFetch<{ data?: { email?: string } }>(path(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (status === 200 && data?.data?.email && me?.adminId !== id) bumpGeneration(data.data.email);
  return NextResponse.json(data, { status });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await requireSuperadmin();
  if (denied) return denied;
  const { id } = await params;
  const me = await getSession();
  if (me?.adminId === id) return NextResponse.json({ success: false, message: "You can't delete your own account." }, { status: 400 });
  const { status, data } = await backendFetch<{ data?: { email?: string } }>(path(id), { method: "DELETE" });
  if (status === 200 && data?.data?.email) bumpGeneration(data.data.email);
  return NextResponse.json(data, { status });
}
