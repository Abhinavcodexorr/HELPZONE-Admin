import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/server/backend";
import { requireSession } from "@/lib/auth/guard";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const denied = await requireSession();
  if (denied) return denied;
  const { id, noteId } = await params;
  const { status, data } = await backendFetch(
    `/api/v1/admin/customers/${encodeURIComponent(id)}/notes/${encodeURIComponent(noteId)}`,
    { method: "DELETE" },
  );
  return NextResponse.json(data, { status });
}
