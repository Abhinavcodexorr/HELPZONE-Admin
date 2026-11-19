import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CountryPicker } from "@/components/auth/CountryPicker";
import { getSession } from "@/lib/auth/guard";
import { safeNextPath } from "@/lib/auth/session";
import { fetchAllCountries } from "@/lib/server/countries";
import { fetchAccess } from "@/lib/server/identity";

export const metadata: Metadata = { title: "Choose a country · Help Zone Admin" };

export default async function SelectCountryPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?ended=1");
  // Countries as they are now, not as they were at sign-in.
  const access = await fetchAccess(session);
  if (!access) redirect("/login?ended=1");

  const { next } = await searchParams;
  const target = safeNextPath(next) ?? "/dashboard";
  const allowed = (await fetchAllCountries()).filter((c) => c.isActive && access.countries.includes(c.code));

  if (allowed.length === 0) redirect("/login?ended=1");
  // Someone with a single country never sees a choice: it is selected for them.
  if (allowed.length === 1 && session.country === allowed[0].code) redirect(target);

  return <CountryPicker countries={allowed} current={session.country} next={target} name={session.name} />;
}
