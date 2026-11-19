import { redirect } from "next/navigation";
import { AdminsManager, type AdminRow, type Rbac } from "@/components/admins/AdminsManager";
import { getSession } from "@/lib/auth/guard";
import { backendFetch } from "@/lib/server/backend";
import { fetchActiveCountries } from "@/lib/server/countries";

export default async function AdminsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "superadmin") redirect("/dashboard");

  const [{ data }, countries, rbac] = await Promise.all([
    backendFetch<{ data?: AdminRow[] }>("/api/v1/admin/admins"),
    fetchActiveCountries(),
    backendFetch<{ data?: Rbac }>("/api/v1/admin/rbac"),
  ]);
  return <AdminsManager initial={data?.data ?? []} countries={countries} meId={session.adminId ?? null} rbac={rbac.data?.data ?? { permissions: [], templates: [] }} />;
}
