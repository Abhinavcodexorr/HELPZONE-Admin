"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Layers, PauseCircle, Plus, SearchX, Wrench } from "lucide-react";
import type { Service } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { DeleteServiceModal } from "./DeleteServiceModal";
import { ServiceCard } from "./ServiceCard";
import { ServiceFormModal } from "./ServiceFormModal";
import { useServices } from "./useServices";

type Filter = "all" | "active" | "inactive";

type FormState = { mode: "create"; presetKey?: string; presetName?: string } | { mode: "edit"; service: Service };

export function ServicesManager() {
  const { services, loading, error, reload, create, update, setActive, remove } = useServices();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  const counts = useMemo(() => {
    const active = services.filter((s) => s.isActive).length;
    return { all: services.length, active, inactive: services.length - active };
  }, [services]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (filter === "active" && !s.isActive) return false;
      if (filter === "inactive" && s.isActive) return false;
      return !q || s.name.toLowerCase().includes(q) || s.key.includes(q) || s.description.toLowerCase().includes(q);
    });
  }, [services, filter, query]);

  async function toggle(service: Service) {
    setBusyId(service.id);
    try {
      const next = !service.isActive;
      await setActive(service.id, next);
      setNotice({ text: `${service.name} ${next ? "activated" : "deactivated"}`, tone: "ok" });
    } catch (err) {
      setNotice({ text: err instanceof Error ? err.message : "Couldn't update the service", tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "active", label: "Active", count: counts.active },
    { value: "inactive", label: "Inactive", count: counts.inactive },
  ];

  return (
    <div>
      <PageHeader
        icon={Wrench}
        title="Services"
        description="Manage the service categories providers can offer"
        actions={
          <Button onClick={() => setForm({ mode: "create" })}>
            <Plus className="h-4 w-4" /> Add service
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-2.5 sm:gap-3">
        <Stat icon={Layers} label="Total services" value={counts.all} loading={loading} tone="primary" />
        <Stat icon={CheckCircle2} label="Active" value={counts.active} loading={loading} tone="success" />
        <Stat icon={PauseCircle} label="Inactive" value={counts.inactive} loading={loading} tone="muted" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Filter services" className="flex gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-border">
            {filters.map((f) => (
              <button
                key={f.value}
                role="tab"
                aria-selected={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95",
                  filter === f.value ? "bg-surface text-primary shadow-sm ring-1 ring-border" : "text-muted hover:text-foreground",
                )}
              >
                {f.label}
                {!loading && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      filter === f.value ? "bg-primary-soft text-primary" : "bg-surface-3 text-muted",
                    )}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Search services..." />
        </div>

        {error && (
          <div className="flex items-center justify-between border-b border-border bg-danger-soft px-4 py-2 text-xs text-danger">
            <span>{error}</span>
            <button onClick={reload} className="font-medium underline">
              Retry
            </button>
          </div>
        )}

        <div className="p-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : services.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No services yet"
              description="Create your first service so providers can choose it when they register."
            />
          ) : visible.length === 0 ? (
            <EmptyState icon={SearchX} title="No services match" description="Try a different search or filter." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((service, index) => (
                <div
                  key={service.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <ServiceCard
                    service={service}
                    busy={busyId === service.id}
                    onToggle={toggle}
                    onEdit={(s) => setForm({ mode: "edit", service: s })}
                    onDelete={setDeleting}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {form && (
        <ServiceFormModal
          key={form.mode === "edit" ? form.service.id : (form.presetKey ?? "new")}
          service={form.mode === "edit" ? form.service : undefined}
          presetKey={form.mode === "create" ? form.presetKey : undefined}
          presetName={form.mode === "create" ? form.presetName : undefined}
          onClose={() => setForm(null)}
          onSubmit={async (input) => {
            if (form.mode === "edit") {
              await update(form.service.id, input);
              setNotice({ text: `${input.name} updated`, tone: "ok" });
            } else {
              await create(input);
              setNotice({ text: `${input.name} added`, tone: "ok" });
            }
          }}
        />
      )}

      {deleting && (
        <DeleteServiceModal
          service={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await remove(deleting.id);
            setNotice({ text: `${deleting.name} deleted`, tone: "ok" });
            setDeleting(null);
          }}
          onDeactivate={async () => {
            await setActive(deleting.id, false);
            setNotice({ text: `${deleting.name} deactivated`, tone: "ok" });
            setDeleting(null);
          }}
        />
      )}

      {notice && (
        <div
          role="status"
          className={cn(
            "fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 animate-pop-in rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl",
            notice.tone === "ok" ? "bg-foreground text-background" : "bg-danger-solid text-white",
          )}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  loading,
  tone,
}: {
  icon: typeof Layers;
  label: string;
  value: number;
  loading: boolean;
  tone: "primary" | "success" | "muted";
}) {
  const toneClass = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    muted: "bg-surface-3 text-muted",
  }[tone];
  return (
    <Card className="flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-3.5 sm:p-4">
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl sm:h-11 sm:w-11", toneClass)}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        {loading ? <Skeleton className="h-6 w-10" /> : <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>}
        <p className="text-xs text-muted">{label}</p>
      </div>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-32" />
      <Skeleton className="mt-2 h-4 w-20" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-2/3" />
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </Card>
  );
}
