"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { setActiveCurrency, type Country } from "@/lib/countries";

export type AdminRole = "superadmin" | "subadmin";

interface CountryContextValue {
  /** The country the admin is working in. */
  country: Country;
  /** Every country this admin may switch to. */
  countries: Country[];
  role: AdminRole;
  name: string;
  switching: boolean;
  /** Switch to another allowed country; the page reloads so everything shows that country's data. */
  switchCountry: (code: string) => Promise<void>;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({
  country,
  countries,
  role,
  name,
  children,
}: {
  country: Country;
  countries: Country[];
  role: AdminRole;
  name: string;
  children: React.ReactNode;
}) {
  // Set during render so the first paint already uses this country's currency.
  setActiveCurrency(country.currencyCode, country.locale);
  const [switching, setSwitching] = useState(false);

  const switchCountry = useCallback(async (code: string) => {
    setSwitching(true);
    try {
      const res = await fetch("/api/auth/country", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: code }),
      });
      if (!res.ok) throw new Error("Couldn't switch country.");
      window.location.reload();
    } catch {
      setSwitching(false);
    }
  }, []);

  const value = useMemo(() => ({ country, countries, role, name, switching, switchCountry }), [country, countries, role, name, switching, switchCountry]);
  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used inside CountryProvider");
  return ctx;
}
