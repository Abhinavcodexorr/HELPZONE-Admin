import type { Provider, User } from "@/types";

const DAY = 86_400_000;

/** Registration/joined date presets shared by the Providers and Users filters. */
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
export const experienceBuckets: { value: ExperienceBucket; label: string; test: (years: number) => boolean }[] = [
  { value: "0-1", label: "0–1 yr", test: (y) => y < 2 },
  { value: "2-4", label: "2–4 yrs", test: (y) => y >= 2 && y < 5 },
  { value: "5-9", label: "5–9 yrs", test: (y) => y >= 5 && y < 10 },
  { value: "10+", label: "10+ yrs", test: (y) => y >= 10 },
];

export type ProviderHas = "photo" | "id" | "pan" | "video" | "complete";
export const providerHas: { value: ProviderHas; label: string; test: (p: Provider) => boolean }[] = [
  { value: "video", label: "Has intro video", test: (p) => Boolean(p.introVideoUrl) },
  { value: "id", label: "Has ID proof", test: (p) => p.documents.some((d) => d.image && !/pan/i.test(d.type)) || Boolean(p.kyc.idDocumentImage) },
  { value: "pan", label: "Has PAN card", test: (p) => Boolean(p.panCard?.idDocumentImage) },
  { value: "photo", label: "Has photo", test: (p) => Boolean(p.kyc.photoImage) },
  { value: "complete", label: "Profile complete", test: (p) => p.profileComplete },
];

export type ProviderSort = "newest" | "oldest" | "name" | "experience";
export const providerSorts: { value: ProviderSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "experience", label: "Most experience" },
];

export interface ProviderFilters {
  services: string[]; // category keys
  city: string; // "" = any
  gender: "any" | "Male" | "Female";
  experience: ExperienceBucket[];
  has: ProviderHas[];
  applied: DatePreset;
  sort: ProviderSort;
}

export const defaultProviderFilters: ProviderFilters = {
  services: [],
  city: "",
  gender: "any",
  experience: [],
  has: [],
  applied: "any",
  sort: "newest",
};

export const countProviderFilters = (f: ProviderFilters) =>
  (f.services.length ? 1 : 0) +
  (f.city ? 1 : 0) +
  (f.gender !== "any" ? 1 : 0) +
  (f.experience.length ? 1 : 0) +
  f.has.length +
  (f.applied !== "any" ? 1 : 0);

export function applyProviderFilters(providers: Provider[], f: ProviderFilters, now: number): Provider[] {
  const out = providers.filter((p) => {
    if (f.services.length && !p.categoryIds.some((id) => f.services.includes(id))) return false;
    if (f.city && p.city !== f.city) return false;
    if (f.gender !== "any" && p.gender !== f.gender) return false;
    if (f.experience.length && !experienceBuckets.some((b) => f.experience.includes(b.value) && b.test(p.experienceYears))) return false;
    if (!f.has.every((h) => providerHas.find((x) => x.value === h)!.test(p))) return false;
    return inDatePreset(p.submittedAt, f.applied, now);
  });

  const byDate = (a: Provider, b: Provider) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  return out.sort((a, b) => {
    if (f.sort === "oldest") return byDate(a, b);
    if (f.sort === "name") return a.fullName.localeCompare(b.fullName);
    if (f.sort === "experience") return b.experienceYears - a.experienceYears || byDate(b, a);
    return byDate(b, a);
  });
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
  f.has.forEach((h) =>
    chips.push({ key: `has-${h}`, label: providerHas.find((x) => x.value === h)!.label, clear: (cur) => ({ has: cur.has.filter((x) => x !== h) }) }),
  );
  if (f.applied !== "any") chips.push({ key: "applied", label: `Applied: ${presetLabel(f.applied)}`, clear: { applied: "any" } });
  return chips;
}

/* ───────────── users ───────────── */

export type BookingBucket = "none" | "1-4" | "5+";
export const bookingBuckets: { value: BookingBucket; label: string; test: (n: number) => boolean }[] = [
  { value: "none", label: "No bookings", test: (n) => n === 0 },
  { value: "1-4", label: "1–4 bookings", test: (n) => n >= 1 && n <= 4 },
  { value: "5+", label: "5+ bookings", test: (n) => n >= 5 },
];

export type UserSort = "newest" | "oldest" | "name" | "bookings";
export const userSorts: { value: UserSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "bookings", label: "Most bookings" },
];

export interface UserFilters {
  status: "all" | "active" | "inactive";
  city: string;
  bookings: BookingBucket[];
  joined: DatePreset;
  flaggedOnly: boolean;
  sort: UserSort;
}

export const defaultUserFilters: UserFilters = { status: "all", city: "", bookings: [], joined: "any", flaggedOnly: false, sort: "newest" };

export function applyUserFilters(users: User[], f: UserFilters, now: number): User[] {
  const out = users.filter((u) => {
    if (f.status !== "all" && u.status !== f.status) return false;
    if (f.city && u.city !== f.city) return false;
    if (f.flaggedOnly && !u.flagged) return false;
    if (f.bookings.length && !bookingBuckets.some((b) => f.bookings.includes(b.value) && b.test(u.bookings))) return false;
    return inDatePreset(u.joinedAt, f.joined, now);
  });
  const byDate = (a: User, b: User) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  return out.sort((a, b) => {
    if (f.sort === "oldest") return byDate(a, b);
    if (f.sort === "name") return a.name.localeCompare(b.name);
    if (f.sort === "bookings") return b.bookings - a.bookings || byDate(b, a);
    return byDate(b, a);
  });
}

export const userPresetLabel = presetLabel;
