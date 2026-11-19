import type { Metadata } from "next";
import { AuditLogView } from "@/components/audit/AuditLogView";

export const metadata: Metadata = { title: "Audit log · Help Zone Admin" };

// Who may open this (the "logs.view" permission) is checked by the layout's access gate and by the backend.
export default function AuditLogsPage() {
  return <AuditLogView />;
}
