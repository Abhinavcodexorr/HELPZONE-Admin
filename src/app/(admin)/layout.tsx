import { redirect } from "next/navigation";
import { SessionGuard } from "@/components/auth/SessionGuard";
import { NewProviderNotifier } from "@/components/notifications/NewProviderNotifier";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getSession } from "@/lib/auth/guard";
import { NotificationsProvider } from "@/store/NotificationsContext";
import { ProvidersProvider } from "@/store/ProvidersContext";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts only checks the cookie's signature; this also catches revoked sessions.
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <ProvidersProvider>
      <NotificationsProvider>
        <SessionGuard />
        <NewProviderNotifier />
        <DashboardShell userEmail={session.email}>{children}</DashboardShell>
      </NotificationsProvider>
    </ProvidersProvider>
  );
}
