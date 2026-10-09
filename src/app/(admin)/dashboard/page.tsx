"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentRegistrations } from "@/components/dashboard/RecentRegistrations";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { PendingApplications } from "@/components/dashboard/PendingApplications";
import { useProviders } from "@/store/ProvidersContext";
import { CheckCircle2, HardHat, ShieldCheck, XCircle } from "lucide-react";

export default function DashboardPage() {
  const { providers } = useProviders();
  const count = (status: "pending" | "approved" | "rejected") =>
    providers.filter((p) => p.status === status).length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of provider applications and platform activity"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Providers"
          value={providers.length.toString()}
          icon={HardHat}
          tone="indigo"
        />
        <StatCard
          label="Pending KYC"
          value={count("pending").toString()}
          icon={ShieldCheck}
          tone="amber"
        />
        <StatCard
          label="Approved"
          value={count("approved").toString()}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Rejected"
          value={count("rejected").toString()}
          icon={XCircle}
          tone="rose"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentRegistrations />
        </div>
        <div className="space-y-4">
          <PendingApplications />
          <CategoryBreakdown />
        </div>
      </div>
    </div>
  );
}
