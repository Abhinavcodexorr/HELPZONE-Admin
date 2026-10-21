import type { User } from "@/types";

const DAY = 86_400_000;

/** Registration/joined date presets shared by the Providers and Customers filters. */
export type DatePreset = "any" | "today" | "7d" | "30d" | "older30";

export const datePresets: { value: DatePreset; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "older30", label: "Older than 30 days" },
];

export function inDatePreset(iso: string, preset: DatePreset, now: number): boolean {
  if (preset === "any") return true;
  const t = new Date(iso).getTime();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (preset === "today") return t >= startOfToday.getTime();
  if (preset === "7d") return t >= now - 7 * DAY;
  if (preset === "30d") return t >= now - 30 * DAY;
  return t < now - 30 * DAY;
}

const presetLabel = (preset: DatePreset) => datePresets.find((p) => p.value === preset)?.label ?? "";

/* ───────────── providers ───────────── */

export type ExperienceBucket = "0-1" | "2-4" | "5-9" | "10+";
export const experienceBuckets: { value: ExperienceBucket; label: string }[] = [
  { value: "0-1", label: "0–1 yr" },
  { value: "2-4", label: "2–4 yrs" },
  { value: "5-9", label: "5–9 yrs" },
  { value: "10+", label: "10+ yrs" },
];

export type ProviderSort = "newest" | "oldest" | "name" | "experience";
export const providerSorts: { value: ProviderSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "experience", label: "Most experience" },
];

/**
 * The provider list filters. They are only *sent* to the API (see providerListQuery); the backend does the
 * filtering and sorting, so the list is always the live data for exactly these keys.
 */
export interface ProviderFilters {
  services: string[]; // category keys
  city: string; // "" = any
  gender: "any" | "Male" | "Female";
  experience: ExperienceBucket[];
  applied: DatePreset;
  sort: ProviderSort;
}

export const defaultProviderFilters: ProviderFilters = {
  services: [],
  city: "",
  gender: "any",
  experience: [],
  applied: "any",
  sort: "newest",
};

/** Query string for GET /api/providers: each filter is sent by its key. */
export function providerListQuery(
  status: string,
  q: string,
  f: ProviderFilters,
  page: number,
  limit: number,
  tz: string,
): string {
  const params = new URLSearchParams({ status, page: String(page), limit: String(limit), sort: f.sort, tz });
  if (q.trim()) params.set("q", q.trim());
  if (f.services.length) params.set("categoryId", f.services.join(","));
  if (f.city) params.set("city", f.city);
  if (f.gender !== "any") params.set("gender", f.gender);
  if (f.experience.length) params.set("experience", f.experience.join(","));
  if (f.applied !== "any") params.set("applied", f.applied);
  return params.toString();
}

export function describeProviderFilters(
  f: ProviderFilters,
  serviceLabel: (key: string) => string,
): { key: string; label: string; clear: Partial<ProviderFilters> | ((f: ProviderFilters) => Partial<ProviderFilters>) }[] {
  const chips: ReturnType<typeof describeProviderFilters> = [];
  f.services.forEach((s) => chips.push({ key: `service-${s}`, label: serviceLabel(s), clear: (cur) => ({ services: cur.services.filter((x) => x !== s) }) }));
  if (f.city) chips.push({ key: "city", label: f.city, clear: { city: "" } });
  if (f.gender !== "any") chips.push({ key: "gender", label: f.gender, clear: { gender: "any" } });
  f.experience.forEach((e) =>
    chips.push({ key: `exp-${e}`, label: experienceBuckets.find((b) => b.value === e)!.label, clear: (cur) => ({ experience: cur.experience.filter((x) => x !== e) }) }),
  );
  if (f.applied !== "any") chips.push({ key: "applied", label: `Applied: ${presetLabel(f.applied)}`, clear: { applied: "any" } });
  return chips;
}

/* ───────────── customers ───────────── */

export type CustomerSort = "newest" | "oldest" | "name" | "plan";
export const customerSorts: { value: CustomerSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "plan", label: "Plan ending soonest" },
];

export interface CustomerFilters {
  status: "all" | "active" | "inactive";
  plan: "any" | "with" | "none";
  city: string;
  joined: DatePreset;
  sort: CustomerSort;
}

export const defaultCustomerFilters: CustomerFilters = { status: "all", plan: "any", city: "", joined: "any", sort: "newest" };

export function applyCustomerFilters(users: User[], f: CustomerFilters, now: number): User[] {
  const out = users.filter((u) => {
    if (f.status !== "all" && u.status !== f.status) return false;
    if (f.plan === "with" && !u.currentPlan) return false;
    if (f.plan === "none" && u.currentPlan) return false;
    if (f.city && u.city !== f.city) return false;
    return inDatePreset(u.joinedAt, f.joined, now);
  });
  const byDate = (a: User, b: User) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  return out.sort((a, b) => {
    if (f.sort === "oldest") return byDate(a, b);
    if (f.sort === "name") return a.name.localeCompare(b.name);
    if (f.sort === "plan") {
      // Plans ending soonest first; customers without a plan last.
      const ea = a.currentPlan ? new Date(a.currentPlan.expiresAt).getTime() : Infinity;
      const eb = b.currentPlan ? new Date(b.currentPlan.expiresAt).getTime() : Infinity;
      return ea - eb || byDate(b, a);
    }
    return byDate(b, a);
  });
}

export const customerPresetLabel = presetLabel;
