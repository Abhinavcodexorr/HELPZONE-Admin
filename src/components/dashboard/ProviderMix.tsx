import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DashboardMetrics } from "@/lib/dashboard-metrics";
import { CardHeader } from "./CardHeader";

export function ProviderMix({ metrics, loading, count }: { metrics: DashboardMetrics; loading: boolean; count: number }) {
  const { male, female } = metrics.gender;
  const known = male + female;
  const maxExp = Math.max(...metrics.experience.map((e) => e.count), 1);

  return (
    <Card className="h-full p-4 sm:p-5">
      <CardHeader
        title="Provider mix"
        caption="Who is signing up"
        hint={{
          body: (
            <>
              <p>
                <b>Gender</b>: share of all providers by the gender on their profile.
              </p>
              <p>
                <b>Experience</b>: providers grouped by the years of experience they entered (0–1, 2–4, 5–9, 10+). Bar height
                is relative to the biggest group.
              </p>
            </>
          ),
        }}
      />

      {loading ? (
        <Skeleton className="h-44 w-full rounded-xl" />
      ) : count === 0 ? (
        <p className="py-8 text-center text-sm text-subtle">No providers yet.</p>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-medium text-fg-2">Gender</p>
            <div className="flex h-3 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full bg-[#3b82f6] transition-[width] duration-700" style={{ width: `${known ? (male / known) * 100 : 0}%` }} />
              <div className="h-full bg-[#ec4899] transition-[width] duration-700" style={{ width: `${known ? (female / known) * 100 : 0}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> Male{" "}
                <b className="tabular-nums text-foreground">{male}</b>
                <span className="tabular-nums">({known ? Math.round((male / known) * 100) : 0}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#ec4899]" /> Female{" "}
                <b className="tabular-nums text-foreground">{female}</b>
                <span className="tabular-nums">({known ? Math.round((female / known) * 100) : 0}%)</span>
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-fg-2">Experience</p>
            <div className="grid grid-cols-4 items-end gap-2">
              {metrics.experience.map((e) => (
                <div key={e.label} className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold tabular-nums text-foreground">{e.count}</span>
                  <div className="flex h-20 w-full items-end">
                    <div
                      className="w-full origin-bottom animate-grow-y rounded-md bg-primary/85"
                      style={{ height: `${Math.max((e.count / maxExp) * 100, e.count ? 8 : 3)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted">{e.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
