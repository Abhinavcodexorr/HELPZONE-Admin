/** Whether a provider lives at the employer's home, comes in daily, or can do either (both). */
export type StayKey = "live_in" | "live_out";

export const STAY_OPTIONS: { key: StayKey; label: string }[] = [
  { key: "live_in", label: "Live in" },
  { key: "live_out", label: "Live out" },
];

export const stayLabel = (key: string) => STAY_OPTIONS.find((o) => o.key === key)?.label ?? key;
