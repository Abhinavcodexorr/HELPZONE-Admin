import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;
  const { status, data } = await backendFetch("/api/v1/admin/services");
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;
  const { status, data } = await backendFetch("/api/v1/admin/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
  });
  return NextResponse.json(data, { status });
}
