import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/guard";
import { backendFetch } from "@/lib/server/backend";

export async function GET() {
  const denied = await requireSuperadmin();
  if (denied) return denied;
  const { status, data } = await backendFetch("/api/v1/admin/admins");
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const denied = await requireSuperadmin();
  if (denied) return denied;
  const { status, data } = await backendFetch("/api/v1/admin/admins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
  });
  return NextResponse.json(data, { status });
}
