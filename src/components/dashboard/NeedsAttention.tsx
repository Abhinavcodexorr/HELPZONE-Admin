import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, FileWarning, UserX, VideoOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { STALE_NEW_DAYS, STALE_VERIFICATION_DAYS, type AttentionItem, type DashboardMetrics } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";
import { CardHeader } from "./CardHeader";

const icons: Record<string, typeof Clock> = {
  "stale-new": Clock,
  "stale-verification": AlertTriangle,
  "missing-id": FileWarning,
  "missing-video": VideoOff,
  incomplete: UserX,
};

const toneClass: Record<AttentionItem["tone"], string> = {
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
};

export function NeedsAttention({ metrics, loading }: { metrics: DashboardMetrics; loading: boolean }) {
  return (
    <Card className="h-full p-4 sm:p-5">
      <CardHeader
        title="Needs attention"
        caption="Things worth a look today"
        hint={{
          body: (
            <>
              <p>Rules checked against the live provider list. Only rules with at least one match are shown.</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  <b>New requests waiting</b>: still in New request {STALE_NEW_DAYS}+ days after signing up.
                </li>
                <li>
                  <b>Stuck in verification</b>: in Verification and unchanged for {STALE_VERIFICATION_DAYS}+ days.
                </li>
                <li>
                  <b>Missing ID / video / incomplete</b>: open requests (New request or Verification) that lack that item.
                </li>
              </ul>
            </>
          ),
        }}
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : metrics.attention.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-foreground">All caught up</p>
          <p className="text-xs text-muted">Nothing is waiting too long or missing documents.</p>
        </div>
      ) : (
        <ul className="-mx-2 divide-y divide-border">
          {metrics.attention.map((item) => {
            const Icon = icons[item.id] ?? AlertTriangle;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", toneClass[item.tone])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{item.label}</span>
                    <span className="block truncate text-xs text-muted">{item.detail}</span>
                  </span>
                  <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                    {item.count}
                  </span>
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-subtle sm:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
