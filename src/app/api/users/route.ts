import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

export async function GET(req: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;
  const qs = req.nextUrl.search;
  const { status, data } = await backendFetch(`/api/v1/admin/customers${qs}`);
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
