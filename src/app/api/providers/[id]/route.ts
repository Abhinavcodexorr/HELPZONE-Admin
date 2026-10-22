import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSession();
  if (denied) return denied;
  const { id } = await params;
  const { status, data } = await backendFetch(`/api/v1/admin/providers/${encodeURIComponent(id)}`);
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSession();
  if (denied) return denied;
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
  const denied = await requireSession();
  if (denied) return denied;
  const { id } = await params;
  const { status, data } = await backendFetch(`/api/v1/admin/providers/${id}`, { method: "DELETE" });
  return NextResponse.json(data, { status });
}
