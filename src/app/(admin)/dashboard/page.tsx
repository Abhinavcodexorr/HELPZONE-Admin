"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentRegistrations } from "@/components/dashboard/RecentRegistrations";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { PendingApplications } from "@/components/dashboard/PendingApplications";
import { users } from "@/data/users";
import { services } from "@/data/services";
import { useProviders } from "@/store/ProvidersContext";
import { Users, HardHat, ShieldCheck, Wrench } from "lucide-react";

export default function DashboardPage() {
  const { providers } = useProviders();
  const pendingKyc = providers.filter((p) => p.status === "pending").length;
  const activeServices = services.filter((s) => s.isActive).length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of users, providers and platform activity"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={users.length.toString()}
          change="+12.4%"
          trend="up"
          icon={Users}
          tone="indigo"
        />
        <StatCard
          label="Total Providers"
          value={providers.length.toString()}
          change="+8.1%"
          trend="up"
          icon={HardHat}
          tone="emerald"
        />
        <StatCard
          label="Pending KYC"
          value={pendingKyc.toString()}
          change="-3.2%"
          trend="down"
          icon={ShieldCheck}
          tone="amber"
        />
        <StatCard
          label="Active Services"
          value={activeServices.toString()}
          change="+2.0%"
          trend="up"
          icon={Wrench}
          tone="sky"
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
