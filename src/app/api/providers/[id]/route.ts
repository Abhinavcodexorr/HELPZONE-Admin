import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.text();
  const { status, data } = await backendFetch(`/api/v1/admin/providers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return NextResponse.json(data, { status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data } = await backendFetch(`/api/v1/admin/providers/${id}`, { method: "DELETE" });
  return NextResponse.json(data, { status });
}
