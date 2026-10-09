import { Provider } from "@/types";

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

function countInBuckets(providers: Provider[], starts: Date[], next: (d: Date) => Date) {
  const times = providers.map((p) => new Date(p.submittedAt).getTime());
  return starts.map((start) => {
    const from = start.getTime();
    const to = next(start).getTime();
    return times.filter((t) => t >= from && t < to).length;
  });
}

export function periodSeries(
  providers: Provider[],
  period: Period,
  now: Date,
  predicate: (p: Provider) => boolean = () => true
): Point[] {
  const items = providers.filter(predicate);

  if (period === "daily") {
    const starts = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(now), i - 13));
    const counts = countInBuckets(items, starts, (d) => addDays(d, 1));
    return starts.map((s, i) => ({ label: shortDate(s), value: counts[i] }));
  }
  if (period === "weekly") {
    const starts = Array.from({ length: 8 }, (_, i) => addDays(startOfWeek(now), (i - 7) * 7));
    const counts = countInBuckets(items, starts, (d) => addDays(d, 7));
    return starts.map((s, i) => ({ label: shortDate(s), value: counts[i] }));
  }
  const starts = Array.from({ length: 6 }, (_, i) => addMonths(startOfMonth(now), i - 5));
  const counts = countInBuckets(items, starts, (d) => addMonths(d, 1));
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
export function weeklyBarGroups(providers: Provider[], now: Date): WeekGroup[] {
  const starts = Array.from({ length: 13 }, (_, i) => addDays(startOfWeek(now), (i - 12) * 7));
  const counts = countInBuckets(providers, starts, (d) => addDays(d, 7));
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

export function countWithin(providers: Provider[], days: number, now: Date, predicate: (p: Provider) => boolean = () => true) {
  const from = addDays(startOfDay(now), -(days - 1)).getTime();
  return providers.filter((p) => predicate(p) && new Date(p.submittedAt).getTime() >= from).length;
}

export function topBy(providers: Provider[], key: (p: Provider) => string, limit = 5) {
  const counts = new Map<string, number>();
  providers.forEach((p) => {
    const k = key(p);
    if (k && k !== "—") counts.set(k, (counts.get(k) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}
