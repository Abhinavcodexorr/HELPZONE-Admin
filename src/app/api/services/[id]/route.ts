import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = await requireSession();
  if (denied) return denied;
  const { id } = await params;
  const { status, data } = await backendFetch(`/api/v1/admin/services/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
  });
  return NextResponse.json(data, { status });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = await requireSession();
  if (denied) return denied;
  const { id } = await params;
  const { status, data } = await backendFetch(`/api/v1/admin/services/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return NextResponse.json(data, { status });
}
