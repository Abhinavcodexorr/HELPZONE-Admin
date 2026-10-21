import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSession();
  if (denied) return denied;
  const { id } = await params;
  const { status, data } = await backendFetch(`/api/v1/admin/customers/${encodeURIComponent(id)}/activate`, {
    method: "PATCH",
  });
  return NextResponse.json(data, { status });
}
