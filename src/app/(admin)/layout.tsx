import { redirect } from "next/navigation";
import { SessionGuard } from "@/components/auth/SessionGuard";
import { NewProviderNotifier } from "@/components/notifications/NewProviderNotifier";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getSession } from "@/lib/auth/guard";
import { NotificationsProvider } from "@/store/NotificationsContext";
import { ProvidersProvider } from "@/store/ProvidersContext";
import { CountryProvider } from "@/store/CountryContext";
import { fetchAllCountries } from "@/lib/server/countries";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts only checks the cookie's signature; this also catches revoked sessions.
  const session = await getSession();
  if (!session) redirect("/login");
  // An admin with several countries chooses one first; with a single country it was selected at sign-in.
  if (!session.country) redirect("/select-country");

  const all = (await fetchAllCountries().catch(() => [])).filter((c) => session.countries.includes(c.code));
  const current = all.find((c) => c.code === session.country);
  // The selected country is no longer one this admin may use (removed or switched off): choose again.
  if (!current) redirect("/select-country");

  return (
    <CountryProvider country={current} countries={all} role={session.role} name={session.name}>
      <ProvidersProvider>
        <NotificationsProvider>
          <SessionGuard />
          <NewProviderNotifier />
          <DashboardShell userEmail={session.email}>{children}</DashboardShell>
        </NotificationsProvider>
      </ProvidersProvider>
    </CountryProvider>
  );
}
