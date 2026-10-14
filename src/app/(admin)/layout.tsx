import { DashboardShell } from "@/components/layout/DashboardShell";
import { getSession } from "@/lib/auth/guard";
import { ProvidersProvider } from "@/store/ProvidersContext";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <ProvidersProvider>
      <DashboardShell userEmail={session?.email ?? ""}>{children}</DashboardShell>
    </ProvidersProvider>
  );
}
