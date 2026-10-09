import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, data } = await backendFetch(`/api/v1/admin/providers/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: body.reason }),
  });
  return NextResponse.json(data, { status });
}
