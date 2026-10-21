import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

type Ctx = { params: Promise<{ id: string }> };
const path = (id: string) => `/api/v1/admin/customers/${encodeURIComponent(id)}`;

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requireSession();
  if (denied) return denied;
  const { id } = await params;
  const { status, data } = await backendFetch(path(id));
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

// Edit profile details (name, phone, city, address).
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireSession();
  if (denied) return denied;
  const { id } = await params;
  const { status, data } = await backendFetch(path(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
  });
  return NextResponse.json(data, { status });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await requireSession();
  if (denied) return denied;
  const { id } = await params;
  const { status, data } = await backendFetch(path(id), { method: "DELETE" });
  return NextResponse.json(data, { status });
}
