import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

export async function GET(req: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;
  const tz = req.nextUrl.searchParams.get("tz") ?? "UTC";
  const { status, data } = await backendFetch(`/api/v1/admin/dashboard?tz=${encodeURIComponent(tz)}`);
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
