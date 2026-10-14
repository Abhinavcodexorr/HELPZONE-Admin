"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProviders } from "@/store/ProvidersContext";
import { periodSeries, type Period } from "@/lib/dashboard-stats";
import type { ProviderStatus } from "@/types";
import { LineChart } from "./charts";

type Filter = ProviderStatus | "all";

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "New request", value: "pending" },
  { label: "Verification", value: "verification" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const periods: { label: string; value: Period }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const periodCaption: Record<Period, string> = {
  daily: "last 14 days",
  weekly: "last 8 weeks",
  monthly: "last 6 months",
};

export function TrendCard() {
  const { providers, loading } = useProviders();
  const [filter, setFilter] = useState<Filter>("all");
  const [period, setPeriod] = useState<Period>("daily");

  const { points, tiles } = useMemo(() => {
    const now = new Date();
    const sum = (predicate: (p: (typeof providers)[number]) => boolean) =>
      periodSeries(providers, period, now, predicate).reduce((total, point) => total + point.value, 0);
    return {
      points: periodSeries(providers, period, now, (p) => filter === "all" || p.status === filter),
      tiles: [
        { label: "Received", value: sum(() => true) },
        { label: "Approved", value: sum((p) => p.status === "approved") },
        { label: "In review", value: sum((p) => p.status === "pending" || p.status === "verification") },
      ],
    };
  }, [providers, filter, period]);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground">Trends</h3>
      <p className="mb-4 text-xs text-muted">Applications over the {periodCaption[period]}</p>

      <div className="flex gap-1 rounded-full bg-surface-3 p-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-1 rounded-full px-2 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
              filter === f.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-3 text-center">
        {tiles.map((tile) => (
          <div key={tile.label}>
            {loading ? (
              <Skeleton className="mx-auto h-6 w-8" />
            ) : (
              <p className="text-lg font-semibold tabular-nums text-foreground">{tile.value}</p>
            )}
            <p className="text-[11px] text-muted">{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <LineChart key={`${filter}-${period}`} points={points} color="var(--primary)" />
        )}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
              period === p.value ? "bg-primary-soft text-primary" : "bg-surface-3 text-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
