"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProviders } from "@/store/ProvidersContext";
import { RingProgress } from "./charts";

const rings = [
  { status: "approved", label: "Approved", color: "#22c55e" },
  { status: "pending", label: "New request", color: "#f5a524" },
  { status: "verification", label: "Verification", color: "#3b82f6" },
  { status: "rejected", label: "Rejected", color: "#f43f5e" },
] as const;

export function StatusRings() {
  const { providers, loading } = useProviders();
  const total = providers.length;

  return (
    <Card className="p-5">
      <h3 className="mb-5 text-sm font-semibold text-foreground">Application status</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {rings.map(({ status, label, color }) => {
          const count = providers.filter((p) => p.status === status).length;
          return (
            <div key={status} className="flex items-center gap-4">
              {loading ? (
                <Skeleton className="h-[84px] w-[84px] shrink-0 rounded-full" />
              ) : (
                <RingProgress percent={total ? (count / total) * 100 : 0} color={color} />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                {loading ? (
                  <Skeleton className="mt-2 h-3 w-16" />
                ) : (
                  <p className="text-xs text-muted">
                    {count} of {total}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
