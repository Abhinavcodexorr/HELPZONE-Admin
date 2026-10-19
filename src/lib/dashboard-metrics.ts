import type { Provider, ProviderStatus, Service } from "@/types";
import { stageForStatus } from "@/lib/provider-stages";
import { dailyFromProviders, topBy, type DailyPoint } from "@/lib/dashboard-stats";

/**
 * Every number on the dashboard comes from here. The main source is the backend's
 * aggregate endpoint (GET /api/dashboard), which counts in the database so the figures
 * stay exact at any size. If that endpoint isn't available yet, the same numbers are
 * computed from the provider list and the services catalog instead (capped at the
 * newest providers). Nothing is stored or hard-coded.
 */

/** Response of the backend's GET /api/v1/admin/dashboard. */
export interface ServerDashboard {
  generatedAt: string;
  total: number;
  stages: Record<ProviderStatus, number>;
  daily: DailyPoint[];
  wait: { openCount: number; avgSubmittedAt: string | null; oldestNewAt: string | null };
  attention: {
    staleNewDays: number;
    staleVerificationDays: number;
    staleNew: number;
    staleVerification: number;
    missingId: number;
    missingVideo: number;
    incomplete: number;
  };
  profile: {
    total: number;
    photo: number;
    idProof: number;
    panCard: number;
    introVideo: number;
    profileComplete: number;
    gender: { male: number; female: number };
    experience: { label: string; count: number }[];
  };
  topCities: { name: string; count: number }[];
  topServices: { key: string; name: string; count: number; isActive: boolean }[];
  services: { active: number; total: number };
}

const DAY = 86_400_000;

/** A new request waiting longer than this is flagged under "Needs attention". */
export const STALE_NEW_DAYS = 2;
/** A provider sitting in verification longer than this (since it last changed) is flagged. */
export const STALE_VERIFICATION_DAYS = 3;

export type StageCounts = Record<ProviderStatus, number>;

export interface AttentionItem {
  id: string;
  label: string;
  detail: string;
  count: number;
  tone: "danger" | "warning" | "info";
  /** Where "Review" goes. */
  href: string;
}

export interface DashboardMetrics {
  total: number;
  /** Providers the profile-quality widgets (documents, mix) cover. */
  profileCount: number;
  /** "server" = exact figures from the dashboard API; "list" = computed from the loaded provider list. */
  source: "server" | "list";
  /** Registrations per day by stage, for the charts. */
  daily: DailyPoint[];
  stages: StageCounts;
  /** True when the backend has more providers than the list we loaded (so charts only cover the newest ones). */
  listCapped: boolean;

  registrations: { today: number; thisWeek: number; lastWeek: number; changePct: number | null };
  /** Registrations per day for the last 14 days (oldest first). */
  dailySeries: number[];

  oldestNewDays: number | null;
  avgOpenWaitDays: number | null;
  approvalRate: number | null;
  decided: number;
  verifiedShare: number | null;
  profileCompletePct: number | null;

  documents: { label: string; have: number; pct: number }[];
  gender: { male: number; female: number };
  experience: { label: string; count: number }[];

  recent: Provider[];
  attention: AttentionItem[];

  topServices: { name: string; count: number; inactive?: boolean }[];
  topServicesSource: "services-api" | "providers";
  topCities: { name: string; count: number }[];

  services: { active: number; total: number } | null;
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);
const ageDays = (iso: string, now: number) => Math.max(0, (now - new Date(iso).getTime()) / DAY);

export function computeMetrics(
  providers: Provider[],
  services: Service[] | null,
  now: number,
  server?: { counts: StageCounts | null; total: number | null },
  stats?: ServerDashboard | null,
): DashboardMetrics {
  if (stats) return fromServer(stats, providers, now);
  const loaded = providers.length;
  const listCapped = server?.total != null && loaded < server.total;

  // Stage counts: counted from the loaded list (so they update instantly after Verify/Approve/Reject),
  // unless the list is capped, in which case the backend's own totals are the accurate ones.
  const derived: StageCounts = { pending: 0, verification: 0, approved: 0, rejected: 0 };
  providers.forEach((p) => {
    derived[p.status] += 1;
  });
  const stages = listCapped && server?.counts ? server.counts : derived;
  const total = listCapped && server?.total != null ? server.total : loaded;

  // Registrations
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const submitted = providers.map((p) => new Date(p.submittedAt).getTime());
  const thisWeek = submitted.filter((t) => t >= now - 7 * DAY).length;
  const lastWeek = submitted.filter((t) => t >= now - 14 * DAY && t < now - 7 * DAY).length;
  const dailySeries = Array.from({ length: 14 }, (_, i) => {
    const from = startOfToday.getTime() - (13 - i) * DAY;
    return submitted.filter((t) => t >= from && t < from + DAY).length;
  });

  // Waiting time
  const pending = providers.filter((p) => p.status === "pending");
  const verifying = providers.filter((p) => p.status === "verification");
  const open = [...pending, ...verifying];
  const oldestNewDays = pending.length ? Math.max(...pending.map((p) => ageDays(p.submittedAt, now))) : null;
  const avgOpenWaitDays = open.length ? open.reduce((sum, p) => sum + ageDays(p.submittedAt, now), 0) / open.length : null;

  // Decisions
  const decided = stages.approved + stages.rejected;
  const approvalRate = pct(stages.approved, decided);
  const verifiedShare = pct(total - stages.pending, total);

  // Profile quality (over the loaded providers)
  const complete = providers.filter((p) => p.profileComplete).length;
  const docs = [
    { label: "Profile photo", have: providers.filter((p) => p.kyc.photoImage).length },
    { label: "ID proof", have: providers.filter((p) => p.kyc.idDocumentImage).length },
    { label: "PAN card", have: providers.filter((p) => p.panCard?.idDocumentImage).length },
    { label: "Intro video", have: providers.filter((p) => p.introVideoUrl).length },
  ].map((d) => ({ ...d, pct: pct(d.have, loaded) ?? 0 }));

  const bucket = (from: number, to: number) => providers.filter((p) => p.experienceYears >= from && p.experienceYears < to).length;

  // Needs attention
  const staleNew = pending.filter((p) => ageDays(p.submittedAt, now) > STALE_NEW_DAYS).length;
  const staleVerification = verifying.filter((p) => ageDays(p.updatedAt, now) > STALE_VERIFICATION_DAYS).length;
  const missingId = open.filter((p) => !p.kyc.idDocumentImage).length;
  const missingVideo = open.filter((p) => !p.introVideoUrl).length;
  const incomplete = open.filter((p) => !p.profileComplete).length;
  const attention: AttentionItem[] = [
    {
      id: "stale-new",
      label: "New requests waiting",
      detail: `Older than ${STALE_NEW_DAYS} days with no action`,
      count: staleNew,
      tone: "danger" as const,
      href: "/providers/new",
    },
    {
      id: "stale-verification",
      label: "Stuck in verification",
      detail: `No change for more than ${STALE_VERIFICATION_DAYS} days`,
      count: staleVerification,
      tone: "warning" as const,
      href: "/providers/verification",
    },
    {
      id: "missing-id",
      label: "Missing ID proof",
      detail: "Open requests with no ID document uploaded",
      count: missingId,
      tone: "warning" as const,
      href: "/providers/new",
    },
    {
      id: "missing-video",
      label: "No intro video",
      detail: "Open requests without an intro video",
      count: missingVideo,
      tone: "info" as const,
      href: "/providers/new",
    },
    {
      id: "incomplete",
      label: "Incomplete profiles",
      detail: "Open requests that haven't finished their profile",
      count: incomplete,
      tone: "info" as const,
      href: "/providers/new",
    },
  ].filter((item) => item.count > 0);

  // Services: prefer the catalog from the services API; otherwise count the categories on providers.
  const fromApi = services && services.length > 0;
  const topServices = fromApi
    ? [...services]
        .filter((s) => s.providerCount > 0)
        .sort((a, b) => b.providerCount - a.providerCount)
        .slice(0, 5)
        .map((s) => ({ name: s.name, count: s.providerCount, inactive: !s.isActive }))
    : topBy(providers, (p) => p.categories);

  return {
    total,
    profileCount: loaded,
    source: "list",
    daily: dailyFromProviders(providers),
    stages,
    listCapped,
    registrations: {
      today: submitted.filter((t) => t >= startOfToday.getTime()).length,
      thisWeek,
      lastWeek,
      changePct: lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null,
    },
    dailySeries,
    oldestNewDays,
    avgOpenWaitDays: avgOpenWaitDays === null ? null : Math.round(avgOpenWaitDays * 10) / 10,
    approvalRate,
    decided,
    verifiedShare,
    profileCompletePct: pct(complete, loaded),
    documents: docs,
    gender: {
      male: providers.filter((p) => p.gender === "Male").length,
      female: providers.filter((p) => p.gender === "Female").length,
    },
    experience: [
      { label: "0–1 yr", count: bucket(0, 2) },
      { label: "2–4 yrs", count: bucket(2, 5) },
      { label: "5–9 yrs", count: bucket(5, 10) },
      { label: "10+ yrs", count: bucket(10, Infinity) },
    ],
    recent: [...providers].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 6),
    attention,
    topServices,
    topServicesSource: fromApi ? "services-api" : "providers",
    topCities: topBy(providers, (p) => p.city),
    services: services ? { active: services.filter((s) => s.isActive).length, total: services.length } : null,
  };
}

/** Where an item from the dashboard should open the provider. */
export const stageHref = (status: ProviderStatus) => `/providers/${stageForStatus(status)?.slug ?? "new"}`;

/** "3 days", "1 day", "5 hrs" — a short human age. */
export function formatAge(days: number | null): string {
  if (days === null) return "—";
  if (days < 1 / 24) return "under an hour";
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours} hr${hours === 1 ? "" : "s"}`;
  }
  const d = Math.round(days * 10) / 10;
  return `${d} day${d === 1 ? "" : "s"}`;
}

function fromServer(stats: ServerDashboard, providers: Provider[], now: number): DashboardMetrics {
  const { stages, wait, profile, attention: a } = stats;
  const total = stats.total;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Registrations per local day come back from the server already bucketed for this browser's time zone.
  const dayKey = (t: number) => {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const sumDays = (fromMs: number, toMs: number) => {
    const from = dayKey(fromMs);
    const to = dayKey(toMs);
    return stats.daily
      .filter((d) => d.date >= from && d.date < to)
      .reduce((sum, d) => sum + d.pending + d.verification + d.approved + d.rejected, 0);
  };
  const tomorrow = startOfToday.getTime() + DAY;
  const thisWeek = sumDays(startOfToday.getTime() - 6 * DAY, tomorrow);
  const lastWeek = sumDays(startOfToday.getTime() - 13 * DAY, startOfToday.getTime() - 6 * DAY);
  const dailySeries = Array.from({ length: 14 }, (_, i) => {
    const from = startOfToday.getTime() - (13 - i) * DAY;
    return sumDays(from, from + DAY);
  });

  const oldestNewDays = wait.oldestNewAt ? ageDays(wait.oldestNewAt, now) : null;
  const avgOpenWaitDays = wait.avgSubmittedAt ? ageDays(wait.avgSubmittedAt, now) : null;
  const decided = stages.approved + stages.rejected;
  const docs = [
    { label: "Profile photo", have: profile.photo },
    { label: "ID proof", have: profile.idProof },
    { label: "PAN card", have: profile.panCard },
    { label: "Intro video", have: profile.introVideo },
  ].map((d) => ({ ...d, pct: pct(d.have, profile.total) ?? 0 }));

  const attention: AttentionItem[] = [
    { id: "stale-new", label: "New requests waiting", detail: `Older than ${a.staleNewDays} days with no action`, count: a.staleNew, tone: "danger" as const, href: "/providers/new" },
    { id: "stale-verification", label: "Stuck in verification", detail: `No change for more than ${a.staleVerificationDays} days`, count: a.staleVerification, tone: "warning" as const, href: "/providers/verification" },
    { id: "missing-id", label: "Missing ID proof", detail: "Open requests with no ID document uploaded", count: a.missingId, tone: "warning" as const, href: "/providers/new" },
    { id: "missing-video", label: "No intro video", detail: "Open requests without an intro video", count: a.missingVideo, tone: "info" as const, href: "/providers/new" },
    { id: "incomplete", label: "Incomplete profiles", detail: "Open requests that haven't finished their profile", count: a.incomplete, tone: "info" as const, href: "/providers/new" },
  ].filter((item) => item.count > 0);

  return {
    total,
    profileCount: profile.total,
    source: "server",
    daily: stats.daily,
    stages,
    listCapped: false,
    registrations: {
      today: sumDays(startOfToday.getTime(), tomorrow),
      thisWeek,
      lastWeek,
      changePct: lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null,
    },
    dailySeries,
    oldestNewDays,
    avgOpenWaitDays: avgOpenWaitDays === null ? null : Math.round(avgOpenWaitDays * 10) / 10,
    approvalRate: pct(stages.approved, decided),
    decided,
    verifiedShare: pct(total - stages.pending, total),
    profileCompletePct: pct(profile.profileComplete, profile.total),
    documents: docs,
    gender: profile.gender,
    experience: profile.experience,
    // The list is newest-first from the backend, so these are exact even when it is capped.
    recent: [...providers].sort((x, y) => new Date(y.submittedAt).getTime() - new Date(x.submittedAt).getTime()).slice(0, 6),
    attention,
    topServices: stats.topServices.map((s) => ({ name: s.name, count: s.count, inactive: !s.isActive })),
    topServicesSource: "services-api",
    topCities: stats.topCities,
    services: stats.services,
  };
}
