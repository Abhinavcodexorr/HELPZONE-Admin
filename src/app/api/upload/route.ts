import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

// Forwards an image picked in the admin UI to the backend's generic upload endpoint.
export async function POST(req: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;
  const { status, data } = await backendFetch("/api/v1/upload", {
    method: "POST",
    body: await req.formData(),
  });
  return NextResponse.json(data, { status });
}
