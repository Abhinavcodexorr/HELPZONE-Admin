"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { InfoHint } from "@/components/ui/InfoHint";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { Sparkline } from "./charts";

type Tone = "primary" | "success" | "warning" | "danger" | "info" | "muted";

const toneClass: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  muted: "bg-surface-3 text-muted",
};

/** One headline number with an icon, a context line, an optional sparkline and a "how is this calculated" hint. */
export function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
  tone = "primary",
  href,
  hint,
  loading,
  spark,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string | null;
  suffix?: string;
  sub?: React.ReactNode;
  tone?: Tone;
  href?: string;
  hint: { title: string; body: React.ReactNode };
  loading: boolean;
  spark?: { values: number[]; color: string };
}) {
  const body = (
    <div className="p-4 sm:p-5">
      {/* Phones: icon above the label so the full label fits; wider screens: side by side. */}
      <div className="flex flex-col items-start gap-2 xl:flex-row xl:items-center xl:gap-2.5">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10", toneClass[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <p className="min-w-0 text-xs font-medium leading-tight text-muted xl:flex-1 xl:truncate xl:pr-6 xl:text-[13px]">{label}</p>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="truncate text-[1.7rem] font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-3xl">
              {typeof value === "number" ? <CountUp value={value} /> : (value ?? "—")}
              {suffix && value !== null && <span className="ml-0.5 text-base font-medium text-muted">{suffix}</span>}
            </p>
          )}
        </div>
        {spark && !loading && (
          <div className="hidden shrink-0 xl:block">
            <Sparkline values={spark.values} color={spark.color} />
          </div>
        )}
      </div>

      <div className="mt-2 min-h-[1.1rem] text-xs text-muted">{loading ? <Skeleton className="h-3 w-24" /> : sub}</div>
    </div>
  );

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      {href ? (
        <Link href={href} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
      <div className="absolute right-2 top-2.5">
        <InfoHint title={hint.title}>{hint.body}</InfoHint>
      </div>
    </Card>
  );
}
