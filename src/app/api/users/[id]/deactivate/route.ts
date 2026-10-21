import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

// Blocks the customer; the body may carry { reason }.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSession();
  if (denied) return denied;
  const { id } = await params;
  const { status, data } = await backendFetch(`/api/v1/admin/customers/${encodeURIComponent(id)}/deactivate`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: (await req.text()) || "{}",
  });
  return NextResponse.json(data, { status });
}
