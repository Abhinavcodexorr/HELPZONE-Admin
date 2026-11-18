import { backendFetch } from "@/lib/server/backend";

export interface CountryInfo {
  code: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  dialCode?: string;
  timezone?: string;
  locale?: string;
  isActive: boolean;
}

// Used only while the backend doesn't have the countries API yet (before it is deployed), so the
// panel still opens. Once the backend is updated, its own list is always used.
const FALLBACK_COUNTRIES: CountryInfo[] = [
  { code: "IN", name: "India", currencyCode: "INR", currencySymbol: "₹", dialCode: "+91", timezone: "Asia/Kolkata", locale: "en-IN", isActive: true },
  { code: "AU", name: "Australia", currencyCode: "AUD", currencySymbol: "$", dialCode: "+61", timezone: "Australia/Sydney", locale: "en-AU", isActive: true },
];

/** Every country (active and not) the platform has. */
export async function fetchAllCountries(): Promise<CountryInfo[]> {
  const result = await backendFetch<{ success?: boolean; data?: CountryInfo[] }>("/api/v1/admin/countries").catch(() => null);
  if (!result || result.status !== 200 || !result.data?.data?.length) {
    console.warn("[countries] The backend has no countries API yet; using the built-in India and Australia list.");
    return FALLBACK_COUNTRIES;
  }
  return result.data.data;
}

export async function fetchActiveCountries(): Promise<CountryInfo[]> {
  return (await fetchAllCountries()).filter((c) => c.isActive);
}
