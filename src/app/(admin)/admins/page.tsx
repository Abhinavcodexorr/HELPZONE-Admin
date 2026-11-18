import { redirect } from "next/navigation";
import { AdminsManager, type AdminRow } from "@/components/admins/AdminsManager";
import { getSession } from "@/lib/auth/guard";
import { backendFetch } from "@/lib/server/backend";
import { fetchActiveCountries } from "@/lib/server/countries";

export default async function AdminsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "superadmin") redirect("/dashboard");

  const [{ data }, countries] = await Promise.all([
    backendFetch<{ data?: AdminRow[] }>("/api/v1/admin/admins"),
    fetchActiveCountries(),
  ]);
  return <AdminsManager initial={data?.data ?? []} countries={countries} meId={session.adminId ?? null} />;
}
