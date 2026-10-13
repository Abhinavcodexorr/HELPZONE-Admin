"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProviders } from "@/store/ProvidersContext";
import { topBy } from "@/lib/dashboard-stats";

function RankedList({
  title,
  items,
  loading,
}: {
  title: string;
  items: { name: string; count: number }[];
  loading: boolean;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="min-w-0">
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-subtle">No data yet</p>
      ) : (
        <ol className="space-y-4">
          {items.map((item, i) => (
            <li key={item.name} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-fg-2">
                  <span className="mr-2 text-subtle">{i + 1}.</span>
                  {item.name}
                </span>
                <span className="font-semibold tabular-nums text-foreground">{item.count}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full origin-left animate-grow-x rounded-full bg-primary"
                  style={{ width: `${(item.count / max) * 100}%`, animationDelay: `${i * 60}ms` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function TopLists() {
  const { providers, loading } = useProviders();
  const categories = useMemo(() => topBy(providers, (p) => p.categories), [providers]);
  const cities = useMemo(() => topBy(providers, (p) => p.city), [providers]);

  return (
    <Card className="h-full p-5">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <RankedList title="Top Categories" items={categories} loading={loading} />
        <RankedList title="Top Cities" items={cities} loading={loading} />
      </div>
    </Card>
  );
}
