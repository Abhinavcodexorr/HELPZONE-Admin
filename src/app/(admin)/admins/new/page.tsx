import { redirect } from "next/navigation";
import { AdminForm } from "@/components/admins/AdminForm";
import type { Rbac } from "@/components/admins/admin-shared";
import { getSession } from "@/lib/auth/guard";
import { backendFetch } from "@/lib/server/backend";
import { fetchActiveCountries } from "@/lib/server/countries";

export default async function NewAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "superadmin") redirect("/dashboard");

  const [countries, rbac] = await Promise.all([fetchActiveCountries(), backendFetch<{ data?: Rbac }>("/api/v1/admin/rbac")]);
  return <AdminForm admin={null} countries={countries} rbac={rbac.data?.data ?? { permissions: [], templates: [] }} isMe={false} />;
}
