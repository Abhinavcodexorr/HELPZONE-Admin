"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Inbox,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Timer,
  UserPlus,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import { ApplicationsChart } from "@/components/dashboard/ApplicationsChart";
import { DocumentCompleteness } from "@/components/dashboard/DocumentCompleteness";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { PipelineCard } from "@/components/dashboard/PipelineCard";
import { ProviderMix } from "@/components/dashboard/ProviderMix";
import { RecentRegistrations } from "@/components/dashboard/RecentRegistrations";
import { TopLists } from "@/components/dashboard/TopLists";
import { TrendCard } from "@/components/dashboard/TrendCard";
import { useDashboardStats } from "@/components/dashboard/useDashboardStats";
import { useServices } from "@/components/services/useServices";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { computeMetrics, formatAge, STALE_VERIFICATION_DAYS } from "@/lib/dashboard-metrics";
import { timeAgo } from "@/lib/utils";
import { useProviders } from "@/store/ProvidersContext";

const TICK_MS = 30_000; // refresh "x min ago" / waiting times
const RELOAD_MS = 60_000; // re-fetch the data while the tab is visible

function Reveal({ children, delay, className = "" }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <div className={`animate-slide-up ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { providers, serverCounts, serverTotal, lastSyncedAt, loading, error, refresh, sync } = useProviders();
  const { services, loading: servicesLoading, error: servicesError, sync: syncServices } = useServices();
  const { stats, loading: statsLoading, sync: syncStats } = useDashboardStats();
  const busy = loading || statsLoading;
  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);

  // Keep the page alive: tick the clock, and quietly re-fetch both APIs every minute.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    const reload = setInterval(() => {
      if (document.hidden) return;
      void sync();
      void syncServices();
      void syncStats();
    }, RELOAD_MS);
    return () => {
      clearInterval(tick);
      clearInterval(reload);
    };
  }, [sync, syncServices, syncStats]);

  const metrics = useMemo(
    () =>
      computeMetrics(providers, servicesError ? null : services, now, { counts: serverCounts, total: serverTotal }, stats),
    [providers, services, servicesError, now, serverCounts, serverTotal, stats],
  );

  async function handleRefresh() {
    setRefreshing(true);
    setNow(Date.now());
    await Promise.all([sync(), syncServices(), syncStats()]);
    setRefreshing(false);
  }

  const { stages, registrations } = metrics;
  const openCount = stages.pending + stages.verification;
  const change = registrations.changePct;
  const staleVerification = metrics.attention.find((a) => a.id === "stale-verification")?.count ?? 0;

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Live overview of provider applications and platform activity"
        actions={
          <>
            <span className="hidden text-xs text-muted sm:inline">
              {lastSyncedAt ? `Updated ${timeAgo(new Date(lastSyncedAt).toISOString(), now).toLowerCase()}` : "Loading…"}
            </span>
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing || busy}>
              {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">
          <span>{error}</span>
          <button onClick={refresh} className="shrink-0 font-semibold underline">
            Retry
          </button>
        </div>
      )}
      {metrics.listCapped && (
        <p className="mb-4 rounded-xl bg-info-soft px-4 py-2.5 text-xs text-info">
          Totals and stage counts are exact. The charts and lists below use the {providers.length} newest of {metrics.total}{" "}
          providers.
        </p>
      )}

      {/* ── headline numbers ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Reveal delay={0}>
          <KpiCard
            icon={Users}
            label="Total providers"
            value={metrics.total}
            tone="primary"
            loading={busy}
            spark={{ values: metrics.dailySeries, color: "#3b82f6" }}
            sub={
              <span className="inline-flex items-center gap-1">
                {change !== null &&
                  (change >= 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-danger" />
                  ))}
                <b className="text-fg-2">{registrations.thisWeek}</b> this week
                {change !== null && <span className={change >= 0 ? "text-success" : "text-danger"}>({change > 0 ? "+" : ""}{change}%)</span>}
              </span>
            }
            hint={{
              title: "Total providers",
              body: (
                <>
                  <p>Every provider account in the system, whatever its stage.</p>
                  <p>
                    <b>This week</b> = sign-ups in the last 7 days. The % compares that with the 7 days before. The line
                    shows sign-ups per day for the last 14 days.
                  </p>
                </>
              ),
            }}
          />
        </Reveal>

        <Reveal delay={40}>
          <KpiCard
            icon={Inbox}
            label="New requests"
            value={stages.pending}
            tone="warning"
            href="/providers/new"
            loading={busy}
            sub={
              metrics.oldestNewDays === null
                ? "Nothing waiting"
                : (
                    <>
                      Oldest waiting <b className="text-fg-2">{formatAge(metrics.oldestNewDays)}</b>
                    </>
                  )
            }
            hint={{
              title: "New requests",
              body: (
                <>
                  <p>Providers who registered and haven&apos;t been touched yet (stage = New request).</p>
                  <p>
                    <b>Oldest waiting</b> = now minus the registration time of the earliest one still in this stage.
                  </p>
                </>
              ),
            }}
          />
        </Reveal>

        <Reveal delay={80}>
          <KpiCard
            icon={ShieldCheck}
            label="In verification"
            value={stages.verification}
            tone="info"
            href="/providers/verification"
            loading={busy}
            sub={
              staleVerification > 0 ? (
                <span className="text-warning">
                  <b>{staleVerification}</b> stuck {STALE_VERIFICATION_DAYS}+ days
                </span>
              ) : stages.verification > 0 ? (
                "Documents being checked"
              ) : (
                "None right now"
              )
            }
            hint={{
              title: "In verification",
              body: (
                <>
                  <p>Providers you moved to Verification and haven&apos;t approved or rejected yet.</p>
                  <p>
                    &quot;Stuck&quot; = in this stage with no change for more than {STALE_VERIFICATION_DAYS} days (measured from
                    the provider&apos;s last update).
                  </p>
                </>
              ),
            }}
          />
        </Reveal>

        <Reveal delay={120}>
          <KpiCard
            icon={CheckCircle2}
            label="Approved"
            value={stages.approved}
            tone="success"
            href="/providers/approved"
            loading={busy}
            sub={
              metrics.approvalRate === null ? (
                "No decisions yet"
              ) : (
                <>
                  <b className="text-fg-2">{metrics.approvalRate}%</b> approval rate
                </>
              )
            }
            hint={{
              title: "Approved",
              body: (
                <>
                  <p>Providers who passed review and are live.</p>
                  <p>
                    <b>Approval rate</b> = Approved ÷ (Approved + Rejected). Providers still in review aren&apos;t counted
                    either way.
                  </p>
                </>
              ),
            }}
          />
        </Reveal>

        <Reveal delay={160}>
          <KpiCard
            icon={XCircle}
            label="Rejected"
            value={stages.rejected}
            tone="danger"
            href="/providers/rejected"
            loading={busy}
            sub={
              metrics.decided === 0 ? (
                "No decisions yet"
              ) : (
                <>
                  <b className="text-fg-2">{100 - (metrics.approvalRate ?? 0)}%</b> of decided
                </>
              )
            }
            hint={{
              title: "Rejected",
              body: (
                <>
                  <p>Providers whose application was turned down (a reason is always recorded).</p>
                  <p>The % is Rejected ÷ (Approved + Rejected).</p>
                </>
              ),
            }}
          />
        </Reveal>

        <Reveal delay={200}>
          <KpiCard
            icon={UserPlus}
            label="Signed up today"
            value={registrations.today}
            tone="primary"
            loading={busy}
            sub={
              <>
                <b className="text-fg-2">{registrations.thisWeek}</b> in the last 7 days
              </>
            }
            hint={{
              title: "Signed up today",
              body: (
                <>
                  <p>Providers whose registration time is since midnight today (your browser&apos;s time zone).</p>
                  <p>It resets at midnight and moves as soon as someone new registers.</p>
                </>
              ),
            }}
          />
        </Reveal>

        <Reveal delay={240}>
          <KpiCard
            icon={Timer}
            label="Avg. wait (open)"
            value={metrics.avgOpenWaitDays === null ? null : metrics.avgOpenWaitDays.toFixed(1)}
            suffix="days"
            tone="warning"
            loading={busy}
            sub={
              openCount === 0 ? (
                "No open requests"
              ) : (
                <>
                  across <b className="text-fg-2">{openCount}</b> open request{openCount === 1 ? "" : "s"}
                </>
              )
            }
            hint={{
              title: "Average wait of open requests",
              body: (
                <>
                  <p>
                    For every provider still in New request or Verification: now minus the time they registered, averaged.
                  </p>
                  <p>A rising number means the review queue is slowing down.</p>
                </>
              ),
            }}
          />
        </Reveal>

        <Reveal delay={280}>
          <KpiCard
            icon={Wrench}
            label="Active services"
            value={metrics.services ? metrics.services.active : null}
            suffix={metrics.services ? `of ${metrics.services.total}` : undefined}
            tone="muted"
            href="/services"
            loading={busy || servicesLoading}
            sub={
              servicesError ? (
                <span className="text-warning">Services API unavailable</span>
              ) : metrics.services && metrics.services.total > metrics.services.active ? (
                `${metrics.services.total - metrics.services.active} switched off`
              ) : (
                "All services on"
              )
            }
            hint={{
              title: "Active services",
              body: (
                <>
                  <p>
                    From the Services catalog: services currently switched on (the ones the apps offer) out of all services
                    you&apos;ve created.
                  </p>
                  <p>Shows a warning if the services API can&apos;t be reached.</p>
                </>
              ),
            }}
          />
        </Reveal>
      </div>

      {/* ── applications over time + pipeline ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 xl:grid-cols-3">
        <Reveal delay={60} className="xl:col-span-2">
          <ApplicationsChart daily={metrics.daily} loading={busy} />
        </Reveal>
        <Reveal delay={100}>
          <PipelineCard metrics={metrics} loading={busy} />
        </Reveal>
      </div>

      {/* ── trends, recent sign-ups, to-do ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 lg:grid-cols-2 xl:grid-cols-3">
        <Reveal delay={60} className="lg:col-span-2 xl:col-span-1">
          <TrendCard daily={metrics.daily} loading={busy} />
        </Reveal>
        <Reveal delay={100}>
          <RecentRegistrations providers={metrics.recent} now={now} loading={loading} />
        </Reveal>
        <Reveal delay={140}>
          <NeedsAttention metrics={metrics} loading={busy} />
        </Reveal>
      </div>

      {/* ── quality + concentration ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 lg:grid-cols-2 xl:grid-cols-3">
        <Reveal delay={60}>
          <DocumentCompleteness metrics={metrics} loading={busy} count={metrics.profileCount} />
        </Reveal>
        <Reveal delay={100}>
          <ProviderMix metrics={metrics} loading={busy} count={metrics.profileCount} />
        </Reveal>
        <Reveal delay={140} className="lg:col-span-2 xl:col-span-1">
          <TopLists metrics={metrics} loading={busy || servicesLoading} />
        </Reveal>
      </div>
    </div>
  );
}
