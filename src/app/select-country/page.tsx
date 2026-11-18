import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CountryPicker } from "@/components/auth/CountryPicker";
import { getSession } from "@/lib/auth/guard";
import { safeNextPath } from "@/lib/auth/session";
import { fetchAllCountries } from "@/lib/server/countries";

export const metadata: Metadata = { title: "Choose a country · Help Zone Admin" };

export default async function SelectCountryPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { next } = await searchParams;
  const target = safeNextPath(next) ?? "/dashboard";
  const allowed = (await fetchAllCountries()).filter((c) => c.isActive && session.countries.includes(c.code));

  // Someone with a single country never sees a choice: it is selected for them.
  if (allowed.length === 1 && session.country === allowed[0].code) redirect(target);

  return <CountryPicker countries={allowed} current={session.country} next={target} name={session.name} />;
}
