import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { backendFetch } from "@/lib/server/backend";

// The backend checks the "logs.view" permission and limits a subadmin to their own countries.
export async function GET(req: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;
  const { status, data } = await backendFetch(`/api/v1/admin/audit-logs${req.nextUrl.search}`);
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
