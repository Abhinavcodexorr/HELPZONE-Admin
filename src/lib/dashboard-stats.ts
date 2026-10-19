import type { Provider, ProviderStatus } from "@/types";

export type Period = "daily" | "weekly" | "monthly";
export interface Point {
  label: string;
  value: number;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfWeek = (d: Date) => {
  const s = startOfDay(d);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
};

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

const shortDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const shortMonth = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });

/** Registrations on one local calendar day, split by current stage. */
export interface DailyPoint extends Record<ProviderStatus, number> {
  /** Local date, YYYY-MM-DD. */
  date: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Fallback when the dashboard API is unavailable: build the daily series from the loaded providers. */
export function dailyFromProviders(providers: Provider[]): DailyPoint[] {
  const byDay = new Map<string, DailyPoint>();
  providers.forEach((p) => {
    const key = dateKey(new Date(p.submittedAt));
    const point = byDay.get(key) ?? { date: key, pending: 0, verification: 0, approved: 0, rejected: 0 };
    point[p.status] += 1;
    byDay.set(key, point);
  });
  return [...byDay.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

function countInBuckets(daily: DailyPoint[], starts: Date[], next: (d: Date) => Date, statuses: ProviderStatus[] | null) {
  return starts.map((start) => {
    const from = dateKey(start);
    const to = dateKey(next(start));
    return daily
      .filter((d) => d.date >= from && d.date < to)
      .reduce((sum, d) => sum + (statuses ? statuses.reduce((n, s) => n + d[s], 0) : d.pending + d.verification + d.approved + d.rejected), 0);
  });
}

export function periodSeries(daily: DailyPoint[], period: Period, now: Date, statuses: ProviderStatus[] | null = null): Point[] {
  if (period === "daily") {
    const starts = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(now), i - 13));
    const counts = countInBuckets(daily, starts, (d) => addDays(d, 1), statuses);
    return starts.map((s, i) => ({ label: shortDate(s), value: counts[i] }));
  }
  if (period === "weekly") {
    const starts = Array.from({ length: 8 }, (_, i) => addDays(startOfWeek(now), (i - 7) * 7));
    const counts = countInBuckets(daily, starts, (d) => addDays(d, 7), statuses);
    return starts.map((s, i) => ({ label: shortDate(s), value: counts[i] }));
  }
  const starts = Array.from({ length: 6 }, (_, i) => addMonths(startOfMonth(now), i - 5));
  const counts = countInBuckets(daily, starts, (d) => addMonths(d, 1), statuses);
  return starts.map((s, i) => ({ label: shortMonth(s), value: counts[i] }));
}

export interface WeekBar {
  label: string;
  value: number;
}
export interface WeekGroup {
  month: string;
  bars: WeekBar[];
}

// Weekly application counts for the last 13 weeks, grouped under their month.
export function weeklyBarGroups(daily: DailyPoint[], now: Date): WeekGroup[] {
  const starts = Array.from({ length: 13 }, (_, i) => addDays(startOfWeek(now), (i - 12) * 7));
  const counts = countInBuckets(daily, starts, (d) => addDays(d, 7), null);
  const groups: WeekGroup[] = [];
  starts.forEach((start, i) => {
    const month = shortMonth(start);
    const bar = { label: `Week of ${shortDate(start)}`, value: counts[i] };
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.bars.push(bar);
    else groups.push({ month, bars: [bar] });
  });
  return groups;
}

export function topBy(providers: Provider[], key: (p: Provider) => string | string[], limit = 5) {
  const counts = new Map<string, number>();
  providers.forEach((p) => {
    const keys = key(p);
    (Array.isArray(keys) ? keys : [keys]).forEach((k) => {
      if (k && k !== "—") counts.set(k, (counts.get(k) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}
