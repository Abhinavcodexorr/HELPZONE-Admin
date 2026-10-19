"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { stageHref } from "@/lib/dashboard-metrics";
import { timeAgo } from "@/lib/utils";
import { useProviders } from "@/store/ProvidersContext";
import type { Provider, ProviderStatus } from "@/types";
import { CardHeader } from "./CardHeader";

const tone: Record<ProviderStatus, "amber" | "blue" | "green" | "red"> = {
  pending: "amber",
  verification: "blue",
  approved: "green",
  rejected: "red",
};
const label: Record<ProviderStatus, string> = {
  pending: "New request",
  verification: "Verification",
  approved: "Approved",
  rejected: "Rejected",
};

export function RecentRegistrations({ providers, now, loading }: { providers: Provider[]; now: number; loading: boolean }) {
  const router = useRouter();
  const { requestView } = useProviders();

  function open(p: Provider) {
    requestView(p.id);
    router.push(stageHref(p.status));
  }

  return (
    <Card className="h-full p-4 sm:p-5">
      <CardHeader
        title="Recent registrations"
        caption="Newest sign-ups, latest first"
        hint={{
          body: (
            <>
              <p>The 6 most recently registered providers, sorted by the time they signed up.</p>
              <p>Click one to open its details. The status badge is its current stage, so it updates as you review.</p>
            </>
          ),
        }}
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-11 w-full rounded-xl" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-3 text-subtle">
            <UserPlus className="h-5 w-5" />
          </span>
          <p className="text-sm text-subtle">No registrations yet.</p>
        </div>
      ) : (
        <ul className="-mx-2 divide-y divide-border">
          {providers.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => open(p)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <Avatar name={p.fullName} color={p.avatarColor} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{p.fullName}</span>
                  <span className="block truncate text-xs text-muted">
                    {[p.city !== "—" ? p.city : null, timeAgo(p.submittedAt, now)].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <Badge tone={tone[p.status]} className="shrink-0">
                  {label[p.status]}
                </Badge>
                <ChevronRight className="hidden h-4 w-4 shrink-0 text-subtle sm:block" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
