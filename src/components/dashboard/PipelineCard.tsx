import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DashboardMetrics } from "@/lib/dashboard-metrics";
import { CardHeader } from "./CardHeader";

const stages = [
  { key: "pending", label: "New request", color: "#f5a524", href: "/providers/new" },
  { key: "verification", label: "Verification", color: "#3b82f6", href: "/providers/verification" },
  { key: "approved", label: "Approved", color: "#22c55e", href: "/providers/approved" },
  { key: "rejected", label: "Rejected", color: "#f43f5e", href: "/providers/rejected" },
] as const;

export function PipelineCard({ metrics, loading }: { metrics: DashboardMetrics; loading: boolean }) {
  const { total, stages: counts } = metrics;

  return (
    <Card className="h-full p-4 sm:p-5">
      <CardHeader
        title="Application pipeline"
        caption="Where every provider is right now"
        hint={{
          body: (
            <>
              <p>
                Each provider is in exactly one stage: <b>New request → Verification → Approved or Rejected</b>.
              </p>
              <p>
                Counts come from the provider list (or the backend&apos;s own totals when there are more providers than the
                list can hold). Percent = stage count ÷ all providers.
              </p>
              <p>
                <b>Reached verification</b> = providers no longer in New request ÷ all. <b>Approval rate</b> = Approved ÷
                (Approved + Rejected).
              </p>
            </>
          ),
        }}
      />

      {loading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : total === 0 ? (
        <p className="py-8 text-center text-sm text-subtle">No providers yet.</p>
      ) : (
        <>
          <div className="flex h-3 overflow-hidden rounded-full bg-surface-3" role="img" aria-label="Providers by stage">
            {stages.map((s) => (
              <div
                key={s.key}
                title={`${s.label}: ${counts[s.key]}`}
                className="h-full transition-[width] duration-700"
                style={{ width: `${(counts[s.key] / total) * 100}%`, background: s.color }}
              />
            ))}
          </div>

          <ul className="mt-4 space-y-1">
            {stages.map((s) => (
              <li key={s.key}>
                <Link
                  href={s.href}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-surface-2"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="min-w-0 flex-1 truncate text-fg-2">{s.label}</span>
                  <span className="font-semibold tabular-nums text-foreground">{counts[s.key]}</span>
                  <span className="w-10 text-right text-xs tabular-nums text-muted">
                    {Math.round((counts[s.key] / total) * 100)}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {metrics.verifiedShare === null ? "—" : `${metrics.verifiedShare}%`}
              </p>
              <p className="text-[11px] text-muted">Reached verification</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {metrics.approvalRate === null ? "—" : `${metrics.approvalRate}%`}
              </p>
              <p className="text-[11px] text-muted">Approval rate</p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
