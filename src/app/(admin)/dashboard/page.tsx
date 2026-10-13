"use client";

import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApplicationsChart } from "@/components/dashboard/ApplicationsChart";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import { StatusRings } from "@/components/dashboard/StatusRings";
import { TrendCard } from "@/components/dashboard/TrendCard";
import { TopLists } from "@/components/dashboard/TopLists";

function Reveal({ children, delay, className = "" }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <div className={`animate-slide-up ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Overview of provider applications and platform activity"
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-7">
          <Reveal delay={0}>
            <ApplicationsChart />
          </Reveal>
          <Reveal delay={80}>
            <OverviewCard />
          </Reveal>
          <Reveal delay={160}>
            <StatusRings />
          </Reveal>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-5">
          <Reveal delay={60}>
            <TrendCard />
          </Reveal>
          <Reveal delay={140} className="flex-1">
            <TopLists />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
