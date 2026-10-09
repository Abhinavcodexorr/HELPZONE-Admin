import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data } = await backendFetch(`/api/v1/admin/providers/${id}/approve`, { method: "PATCH" });
  return NextResponse.json(data, { status });
}
