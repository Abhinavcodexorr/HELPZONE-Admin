import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DashboardMetrics } from "@/lib/dashboard-metrics";
import { CardHeader } from "./CardHeader";

const barColor = (pct: number) => (pct >= 80 ? "bg-success-solid" : pct >= 50 ? "bg-primary" : "bg-warning");

export function DocumentCompleteness({ metrics, loading, count }: { metrics: DashboardMetrics; loading: boolean; count: number }) {
  return (
    <Card className="h-full p-4 sm:p-5">
      <CardHeader
        title="Document completeness"
        caption={loading ? "Checking profiles…" : `Across ${count} provider${count === 1 ? "" : "s"}`}
        hint={{
          body: (
            <>
              <p>
                For each item: providers who have it ÷ all providers. A provider &quot;has&quot; a profile photo, ID
                proof or intro video when its file URL is saved, and a PAN card when a PAN-type document with an image
                was uploaded.
              </p>
              <p>Green is 80%+, blue 50–79%, amber below 50%.</p>
            </>
          ),
        }}
      />

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : count === 0 ? (
        <p className="py-8 text-center text-sm text-subtle">No providers yet.</p>
      ) : (
        <ul className="space-y-4">
          {metrics.documents.map((d) => (
            <li key={d.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium text-fg-2">{d.label}</span>
                <span className="tabular-nums text-muted">
                  <span className="font-semibold text-foreground">{d.have}</span> / {count} · {d.pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={`h-full origin-left animate-grow-x rounded-full ${barColor(d.pct)}`}
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && metrics.profileCompletePct !== null && (
        <p className="mt-5 border-t border-border pt-4 text-xs text-muted">
          <span className="font-semibold text-foreground">{metrics.profileCompletePct}%</span> have finished their full
          profile.
        </p>
      )}
    </Card>
  );
}
