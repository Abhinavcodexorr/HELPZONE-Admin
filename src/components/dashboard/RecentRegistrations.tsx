"use client";

import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { useProviders } from "@/store/ProvidersContext";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const statusTone = {
  approved: "green",
  pending: "amber",
  rejected: "red",
} as const;

export function RecentRegistrations() {
  const { providers } = useProviders();
  const recent = [...providers]
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
    .slice(0, 6);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Recent Provider Registrations</h3>
          <p className="text-xs text-gray-500">Newest maids, cooks & technicians on the platform</p>
        </div>
        <Link
          href="/providers"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-1">
        {recent.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-gray-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={p.fullName} color={p.avatarColor} size={38} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{p.fullName}</p>
                <p className="truncate text-xs text-gray-500">
                  {p.category} &middot; {p.city}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-xs text-gray-400 sm:block">
                {formatDate(p.submittedAt)}
              </span>
              <Badge tone={statusTone[p.status]}>{p.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
