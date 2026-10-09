"use client";

import { Card } from "@/components/ui/Card";
import { useProviders } from "@/store/ProvidersContext";

const colors: Record<string, string> = {
  Maid: "#6366f1",
  Cook: "#f59e0b",
  Plumber: "#06b6d4",
  Electrician: "#22c55e",
  Nanny: "#ec4899",
  Driver: "#8b5cf6",
  Gardener: "#84cc16",
  Cleaner: "#f43f5e",
};

export function CategoryBreakdown() {
  const { providers } = useProviders();
  const counts = providers.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? Math.max(...entries.map(([, c]) => c)) : 1;

  if (entries.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-900">Providers by Category</h3>
        <p className="mb-4 text-xs text-gray-500">Distribution across service types</p>
        <p className="py-6 text-center text-sm text-gray-400">No providers yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-900">Providers by Category</h3>
      <p className="mb-4 text-xs text-gray-500">Distribution across service types</p>

      <div className="space-y-3">
        {entries.map(([category, count]) => (
          <div key={category}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{category}</span>
              <span className="text-gray-400">{count}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(count / max) * 100}%`,
                  backgroundColor: colors[category] ?? "#6366f1",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
