import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;
  const { status, data } = await backendFetch("/api/v1/admin/providers/summary");
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
