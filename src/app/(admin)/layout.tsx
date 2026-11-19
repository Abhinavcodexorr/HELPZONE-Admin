import { redirect } from "next/navigation";
import { SessionGuard } from "@/components/auth/SessionGuard";
import { NewProviderNotifier } from "@/components/notifications/NewProviderNotifier";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getSession } from "@/lib/auth/guard";
import { NotificationsProvider } from "@/store/NotificationsContext";
import { ProvidersProvider } from "@/store/ProvidersContext";
import { CountryProvider } from "@/store/CountryContext";
import { fetchAllCountries } from "@/lib/server/countries";
import { AccessProvider } from "@/store/AccessContext";
import { fetchAccess } from "@/lib/server/identity";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts only checks the cookie's signature; this also catches revoked sessions.
  const session = await getSession();
  if (!session) redirect("/login?ended=1");
  // An admin with several countries chooses one first; with a single country it was selected at sign-in.
  if (!session.country) redirect("/select-country");

  // Rights are read fresh, so a change made by a superadmin applies on the next page load.
  const access = await fetchAccess(session);
  if (!access) redirect("/login?ended=1");

  const all = (await fetchAllCountries().catch(() => [])).filter((c) => access.countries.includes(c.code));
  const current = all.find((c) => c.code === session.country);
  // The selected country is no longer one this admin may use (removed or switched off): choose again.
  if (!current) redirect("/select-country");

  return (
    <CountryProvider country={current} countries={all} role={session.role} name={session.name}>
      <AccessProvider permissions={access.permissions} template={access.template} isSuperadmin={session.role === "superadmin"}>
        <ProvidersProvider>
          <NotificationsProvider>
            <SessionGuard />
            <NewProviderNotifier />
            <DashboardShell userEmail={session.email}>{children}</DashboardShell>
          </NotificationsProvider>
        </ProvidersProvider>
      </AccessProvider>
    </CountryProvider>
  );
}
