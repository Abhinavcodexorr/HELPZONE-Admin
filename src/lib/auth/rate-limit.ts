// In-memory failed-login limiter. Fine for a single pm2 process; resets on restart.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_KEY = 8;
const MAX_FAILURES_GLOBAL = 40;

const failures = new Map<string, number[]>();

function recent(key: string, now: number) {
  const list = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length) failures.set(key, list);
  else failures.delete(key);
  return list;
}

export function isLimited(key: string): boolean {
  const now = Date.now();
  return recent(key, now).length >= MAX_FAILURES_PER_KEY || recent("*", now).length >= MAX_FAILURES_GLOBAL;
}

export function recordFailure(key: string) {
  const now = Date.now();
  failures.set(key, [...recent(key, now), now]);
  failures.set("*", [...recent("*", now), now]);
}

export function clearFailures(key: string) {
  failures.delete(key);
}
