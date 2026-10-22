"use client";

import { Loader2, Pencil, Trash2, Users } from "lucide-react";
import type { Service } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ServiceIcon } from "./ServiceIcon";

export function ServiceCard({
  service,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: {
  service: Service;
  busy: boolean;
  onToggle: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}) {
  const active = service.isActive;

  return (
    <Card className={cn("group flex flex-col p-5 transition-shadow hover:shadow-md", !active && "bg-surface-2/60")}>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 transition-colors",
            active ? "bg-primary-soft text-primary ring-primary/15" : "bg-surface-3 text-subtle ring-border",
          )}
        >
          <ServiceIcon name={service.icon} label={service.name} className="h-6 w-6 text-lg" />
        </span>
        <Badge tone={active ? "green" : "gray"} dot>
          {active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <h3 className={cn("mt-4 text-base font-semibold", active ? "text-foreground" : "text-muted")}>{service.name}</h3>
      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted">
        {service.description || <span className="text-subtle">No description</span>}
      </p>

      {service.subCategories && service.subCategories.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Sub-categories">
          {service.subCategories.slice(0, 4).map((s) => (
            <li
              key={s.key}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1",
                s.isActive ? "bg-primary-soft text-primary ring-primary/15" : "bg-surface-2 text-subtle line-through ring-border",
              )}
            >
              {s.name}
            </li>
          ))}
          {service.subCategories.length > 4 && (
            <li className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-border">
              +{service.subCategories.length - 4} more
            </li>
          )}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <Users className="h-3.5 w-3.5" />
        <span className="font-medium text-fg-2">{service.providerCount}</span>
        {service.providerCount === 1 ? "provider" : "providers"}
        {service.providerCount > 0 && <span className="text-subtle">· {service.approvedProviderCount} approved</span>}
      </div>

      {/* Pushes the footer to the bottom so every card in a row is the same height. */}
      <div className="flex-1" />
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={active ? `Deactivate ${service.name}` : `Activate ${service.name}`}
          disabled={busy}
          onClick={() => onToggle(service)}
          className="flex items-center gap-2.5 text-xs font-medium text-fg-2 disabled:opacity-60"
        >
          <span
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              active ? "bg-success-solid" : "bg-border",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform",
                active ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin text-muted" />}
            </span>
          </span>
          {active ? "Active" : "Inactive"}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(service)}
            aria-label={`Edit ${service.name}`}
            title="Edit"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-3 hover:text-foreground active:scale-90"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(service)}
            aria-label={`Delete ${service.name}`}
            title="Delete"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger active:scale-90"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
