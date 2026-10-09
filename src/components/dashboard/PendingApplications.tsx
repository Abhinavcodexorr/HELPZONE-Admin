"use client";

import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useProviders } from "@/store/ProvidersContext";
import Link from "next/link";
import { ArrowUpRight, IdCard } from "lucide-react";

export function PendingApplications() {
  const { providers } = useProviders();
  const pending = providers.filter((p) => p.status === "pending").slice(0, 5);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Pending KYC Reviews</h3>
          <p className="text-xs text-gray-500">Provider applications awaiting approval</p>
        </div>
        <Link
          href="/providers"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Review <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {pending.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">All caught up 🎉</p>
      ) : (
        <div className="space-y-1">
          {pending.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-gray-50">
              <Avatar name={p.fullName} color={p.avatarColor} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{p.fullName}</p>
                <p className="truncate text-xs text-gray-500">
                  {p.kyc.idType} &middot; {p.category}
                </p>
              </div>
              <IdCard className="h-4 w-4 shrink-0 text-amber-500" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
