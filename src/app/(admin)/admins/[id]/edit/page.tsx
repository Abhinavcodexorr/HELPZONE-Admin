import { notFound, redirect } from "next/navigation";
import { AdminForm } from "@/components/admins/AdminForm";
import type { AdminRow, Rbac } from "@/components/admins/admin-shared";
import { getSession } from "@/lib/auth/guard";
import { backendFetch } from "@/lib/server/backend";
import { fetchActiveCountries } from "@/lib/server/countries";

export default async function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "superadmin") redirect("/dashboard");
  const { id } = await params;

  const [list, countries, rbac] = await Promise.all([
    backendFetch<{ data?: AdminRow[] }>("/api/v1/admin/admins"),
    fetchActiveCountries(),
    backendFetch<{ data?: Rbac }>("/api/v1/admin/rbac"),
  ]);
  const admin = (list.data?.data ?? []).find((a) => a.id === id);
  if (!admin) notFound();
  return <AdminForm key={admin.id} admin={admin} countries={countries} rbac={rbac.data?.data ?? { permissions: [], templates: [] }} isMe={session.adminId === admin.id} />;
}
