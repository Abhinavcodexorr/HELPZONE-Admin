import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";

export async function GET(req: NextRequest) {
  const { status, data } = await backendFetch(`/api/v1/admin/providers${req.nextUrl.search}`);
  return NextResponse.json(data, { status });
}
