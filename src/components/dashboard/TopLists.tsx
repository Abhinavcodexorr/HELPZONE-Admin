import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DashboardMetrics } from "@/lib/dashboard-metrics";
import { CardHeader } from "./CardHeader";

function RankedList({
  title,
  items,
  loading,
  note,
}: {
  title: string;
  items: { name: string; count: number; inactive?: boolean }[];
  loading: boolean;
  note?: string;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="min-w-0">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h4>
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-subtle">No data yet</p>
      ) : (
        <ol className="space-y-3.5">
          {items.map((item, i) => (
            <li key={item.name} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-fg-2">
                  <span className="mr-2 text-subtle">{i + 1}.</span>
                  {item.name}
                  {item.inactive && <span className="ml-1.5 rounded bg-surface-3 px-1 py-0.5 text-[10px] text-muted">inactive</span>}
                </span>
                <span className="font-semibold tabular-nums text-foreground">{item.count}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full origin-left animate-grow-x rounded-full bg-primary"
                  style={{ width: `${(item.count / max) * 100}%`, animationDelay: `${i * 60}ms` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
      {note && !loading && items.length > 0 && <p className="mt-3 text-[11px] text-subtle">{note}</p>}
    </div>
  );
}

export function TopLists({ metrics, loading }: { metrics: DashboardMetrics; loading: boolean }) {
  return (
    <Card className="h-full p-4 sm:p-5">
      <CardHeader
        title="Top services & cities"
        caption="Where providers are concentrated"
        hint={{
          body: (
            <>
              <p>
                <b>Services</b>: from the Services catalog, each service&apos;s provider count (providers who listed it),
                highest first, top 5. If the catalog is empty or unreachable, the service names are counted straight from
                provider profiles instead.
              </p>
              <p>
                <b>Cities</b>: providers grouped by the city on their profile, top 5.
              </p>
            </>
          ),
        }}
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1 min-[1400px]:grid-cols-2">
        <RankedList
          title="Services"
          items={metrics.topServices}
          loading={loading}
          note={metrics.topServicesSource === "providers" ? "Counted from provider profiles" : undefined}
        />
        <RankedList title="Cities" items={metrics.topCities} loading={loading} />
      </div>
    </Card>
  );
}
