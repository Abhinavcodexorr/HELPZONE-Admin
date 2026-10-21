"use client";

import { Loader2, Pencil, Star, Trash2 } from "lucide-react";
import type { Plan } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn, formatRupees } from "@/lib/utils";

export function PlanCard({
  plan,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  busy: boolean;
  onToggle: (plan: Plan) => void;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}) {
  const active = plan.isActive;

  return (
    <Card className={cn("group flex flex-col p-5 transition-shadow hover:shadow-md", !active && "bg-surface-2/60")}>
      <div className="flex items-start justify-between gap-3">
        {plan.isPopular ? (
          <Badge tone="indigo" dot>
            <Star className="h-3 w-3" /> Most Popular
          </Badge>
        ) : (
          <span />
        )}
        <Badge tone={active ? "green" : "gray"} dot>
          {active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <h3 className={cn("mt-4 text-base font-semibold", active ? "text-foreground" : "text-muted")}>{plan.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted">
        {plan.description || <span className="text-subtle">No description</span>}
      </p>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-foreground">{formatRupees(plan.price)}</span>
        {plan.originalPrice && (
          <span className="text-sm text-subtle line-through">{formatRupees(plan.originalPrice)}</span>
        )}
        <span className="text-xs text-muted">/ {plan.durationDays} days</span>
      </div>

      {plan.features.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {plan.features.slice(0, 3).map((f) => (
            <li key={f} className="truncate">
              • {f}
            </li>
          ))}
          {plan.features.length > 3 && <li className="text-subtle">+{plan.features.length - 3} more</li>}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={active ? `Deactivate ${plan.name}` : `Activate ${plan.name}`}
          disabled={busy}
          onClick={() => onToggle(plan)}
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
            onClick={() => onEdit(plan)}
            aria-label={`Edit ${plan.name}`}
            title="Edit"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-3 hover:text-foreground active:scale-90"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(plan)}
            aria-label={`Delete ${plan.name}`}
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
