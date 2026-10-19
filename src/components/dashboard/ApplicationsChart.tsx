"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { weeklyBarGroups, type DailyPoint } from "@/lib/dashboard-stats";
import { CardHeader } from "./CardHeader";

export function ApplicationsChart({ daily, loading }: { daily: DailyPoint[]; loading: boolean }) {
  const groups = useMemo(() => weeklyBarGroups(daily, new Date()), [daily]);

  const bars = groups.flatMap((g) => g.bars);
  const max = Math.max(...bars.map((b) => b.value), 1);
  const average = bars.reduce((sum, b) => sum + b.value, 0) / bars.length;
  let index = 0;

  return (
    <Card className="h-full p-4 sm:p-5">
      <CardHeader
        title="Applications"
        caption="New provider applications per week"
        hint={{
          body: (
            <>
              <p>
                One bar per week for the last 13 weeks (weeks start on Monday). Height = providers who signed up that week,
                counted from each provider&apos;s registration time.
              </p>
              <p>Blue bars are at or above the average; the dashed line is the 13-week average. Hover a bar for its count.</p>
            </>
          ),
        }}
        action={
          <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground sm:inline-flex">
            <CalendarDays className="h-3.5 w-3.5" />
            Last 3 months
          </span>
        }
      />

      {loading ? (
        <Skeleton className="h-52 w-full rounded-xl" />
      ) : (
        <>
          <div className="relative h-44 sm:h-52">
            {average > 0 && (
              <div
                className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-amber-400/80"
                style={{ bottom: `${(average / max) * 100}%` }}
                title={`Average ${average.toFixed(1)} per week`}
              />
            )}
            <div className="flex h-full items-end gap-2 sm:gap-4">
              {groups.map((group) => (
                <div key={group.month} className="flex h-full items-end gap-1 sm:gap-1.5" style={{ flex: group.bars.length }}>
                  {group.bars.map((bar) => {
                    const i = index++;
                    const highlight = bar.value > 0 && bar.value >= average;
                    return (
                      <div key={bar.label} className="group relative flex h-full flex-1 items-end">
                        <div
                          title={`${bar.label}: ${bar.value}`}
                          style={{ height: `${Math.max((bar.value / max) * 100, 5)}%`, animationDelay: `${i * 35}ms` }}
                          className={`w-full origin-bottom animate-grow-y rounded-md transition-colors duration-200 ${
                            highlight ? "bg-primary" : "bg-surface-3 group-hover:bg-border"
                          }`}
                        />
                        {bar.value > 0 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            {bar.value}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-2 sm:gap-4">
            {groups.map((group) => (
              <p
                key={group.month}
                className="text-center text-xs font-semibold text-primary"
                style={{ flex: group.bars.length }}
              >
                {group.month}
              </p>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
