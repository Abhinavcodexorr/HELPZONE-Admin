"use client";

import { useMemo } from "react";
import { ArrowUp, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProviders } from "@/store/ProvidersContext";
import { countWithin, periodSeries } from "@/lib/dashboard-stats";
import { Sparkline } from "./charts";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
      {children}
    </span>
  );
}

function Metric({ value, label, suffix }: { value: number | string; label: string; suffix?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-2xl font-semibold tracking-tight text-foreground">
        {typeof value === "number" && Number.isInteger(value) ? <CountUp value={value} /> : value}
        {suffix && <span className="ml-0.5 text-base font-medium text-muted">{suffix}</span>}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export function OverviewCard() {
  const { providers, loading } = useProviders();

  const stats = useMemo(() => {
    const now = new Date();
    const decided = providers.filter((p) => p.status === "approved" || p.status === "rejected");
    const approved = providers.filter((p) => p.status === "approved").length;
    const experience = providers.length
      ? providers.reduce((sum, p) => sum + p.experienceYears, 0) / providers.length
      : 0;
    return {
      total: providers.length,
      pending: providers.filter((p) => p.status === "pending" || p.status === "verification").length,
      approvalRate: decided.length ? Math.round((approved / decided.length) * 100) : null,
      decided: decided.length,
      experience: Math.round(experience * 10) / 10,
      thisWeek: countWithin(providers, 7, now),
      applicationsTrend: periodSeries(providers, "monthly", now).map((p) => p.value),
      pendingTrend: periodSeries(providers, "monthly", now, (p) => p.status === "pending" || p.status === "verification").map((p) => p.value),
    };
  }, [providers]);

  if (loading) {
    return (
      <Card className="p-5">
        <Skeleton className="mb-5 h-4 w-24" />
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="mb-5 text-sm font-semibold text-foreground">Overview</h3>
      <div className="space-y-6">
        <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-4">
          <Metric value={stats.total} label="Total applications" />
          <Sparkline values={stats.applicationsTrend} color="#22c55e" />
          <Metric
            value={stats.approvalRate === null ? "—" : stats.approvalRate}
            suffix={stats.approvalRate === null ? undefined : "%"}
            label="Approval rate"
          />
          <Pill>
            <ArrowUp className="h-3 w-3" />
            {stats.thisWeek} this week
          </Pill>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-4">
          <Metric value={stats.pending} label="Awaiting review" />
          <Sparkline values={stats.pendingTrend} color="#3b82f6" />
          <Metric value={stats.experience} suffix="yrs" label="Avg. experience" />
          <Pill>
            <Users className="h-3 w-3" />
            {stats.decided} reviewed
          </Pill>
        </div>
      </div>
    </Card>
  );
}
