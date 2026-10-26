"use client";

import { Loader2, MapPin, Phone, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { labelForCategory } from "@/lib/map-provider";
import { cn, formatDate } from "@/lib/utils";
import type { User } from "@/types";

/** A customer as a card, in the same style as the Services cards. */
export function CustomerCard({
  user,
  busy,
  selected,
  onSelect,
  onOpen,
  onToggle,
}: {
  user: User;
  busy: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  /** Active -> asks to block; Blocked -> unblocks. */
  onToggle: () => void;
}) {
  const active = user.status === "active";
  const place = [user.city !== "—" ? user.city : "", user.state].filter(Boolean).join(", ");

  return (
    <Card className={cn("group flex flex-col p-5 transition-shadow hover:shadow-md", !active && "bg-danger-soft/30", selected && "ring-2 ring-primary")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            aria-label={`Select ${user.name}`}
            className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
          />
          <Avatar name={user.name} color={user.avatarColor} size={48} />
        </div>
        <Badge tone={active ? "green" : "red"} dot>
          {active ? "Active" : "Blocked"}
        </Badge>
      </div>

      <button type="button" onClick={onOpen} className="mt-4 min-w-0 text-left">
        <h3 className={cn("truncate text-base font-semibold transition-colors group-hover:text-primary", active ? "text-foreground" : "text-muted")}>{user.name}</h3>
        <p className="truncate text-sm text-muted">{user.email}</p>
      </button>

      <dl className="mt-3 space-y-1.5 text-sm text-fg-2">
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-subtle" />
          <dd className="truncate">{user.phone}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-subtle" />
          <dd className="truncate">{place || "No location yet"}</dd>
        </div>
      </dl>

      {user.currentPlan ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-xs text-primary ring-1 ring-primary/15">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 truncate">
            <b>{user.currentPlan.planName}</b> · {user.currentPlan.daysLeft}d left
          </span>
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-subtle ring-1 ring-border">No active plan</p>
      )}

      {user.lookingFor.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Looking for">
          {user.lookingFor.slice(0, 3).map((k) => (
            <li key={k} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent">
              {labelForCategory(k)}
            </li>
          ))}
          {user.lookingFor.length > 3 && (
            <li className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-border">+{user.lookingFor.length - 3} more</li>
          )}
        </ul>
      )}

      {!active && (
        <p className="mt-3 truncate text-[11px] text-danger" title={user.blockReason}>
          {user.blockedUntil ? `Blocked until ${formatDate(user.blockedUntil)}` : "Blocked until unblocked"}
          {user.blockReason ? ` · ${user.blockReason}` : ""}
        </p>
      )}

      {/* Pushes the footer to the bottom so every card in a row is the same height. */}
      <div className="flex-1" />
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={active ? `Block ${user.name}` : `Unblock ${user.name}`}
          disabled={busy}
          onClick={onToggle}
          className="flex items-center gap-2.5 text-xs font-medium text-fg-2 disabled:opacity-60"
        >
          <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", active ? "bg-success-solid" : "bg-border")}>
            <span
              className={cn(
                "absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform",
                active ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin text-muted" />}
            </span>
          </span>
          {active ? "Active" : "Blocked"}
        </button>
        <span className="text-[11px] text-muted">Joined {formatDate(user.joinedAt)}</span>
      </div>
    </Card>
  );
}
