"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpDown, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./SearchInput";

/** One active filter, shown as a removable chip under the toolbar. */
export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Shared filter bar for list pages: search, a "Filters" button (with an active-count badge)
 * that opens the full panel, a sort menu, always-visible quick filters, and the active
 * filters as removable chips with "Clear all".
 */
export function FilterToolbar<S extends string>({
  query,
  onQuery,
  placeholder,
  sort,
  sortOptions,
  onSort,
  quick,
  panel,
  chips,
  onClear,
}: {
  query: string;
  onQuery: (value: string) => void;
  placeholder: string;
  sort: S;
  sortOptions: { value: S; label: string }[];
  onSort: (value: S) => void;
  quick?: ReactNode;
  panel: ReactNode;
  chips: FilterChip[];
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[200px] flex-1 sm:max-w-sm">
          <SearchInput value={query} onChange={onQuery} placeholder={placeholder} fullWidth />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition active:scale-95",
            open || chips.length > 0
              ? "border-primary/40 bg-primary-soft text-primary"
              : "border-border bg-surface text-fg-2 hover:bg-surface-2",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {chips.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {chips.length}
            </span>
          )}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>

        <label className="relative flex items-center">
          <ArrowUpDown className="pointer-events-none absolute left-3 h-4 w-4 text-subtle" />
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as S)}
            className="appearance-none rounded-lg border border-border bg-surface py-2 pl-9 pr-8 text-sm text-fg-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-subtle" />
        </label>
      </div>

      {quick && <div className="flex flex-wrap items-center gap-1.5">{quick}</div>}

      {open && (
        <div className="grid animate-fade-in gap-x-6 gap-y-4 rounded-xl bg-surface-2 p-4 ring-1 ring-border sm:grid-cols-2 xl:grid-cols-3">
          {panel}
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="flex animate-fade-in items-center gap-1 rounded-full bg-primary-soft py-1 pl-3 pr-1 text-xs font-medium text-primary ring-1 ring-primary/15"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove filter ${chip.label}`}
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/15"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button type="button" onClick={onClear} className="ml-1 text-xs font-semibold text-muted underline-offset-2 hover:text-foreground hover:underline">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
      {children}
    </div>
  );
}

/** A toggle pill. `count` is how many rows it would match. */
export function Pill({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition active:scale-95",
        active ? "bg-primary text-primary-foreground ring-primary" : "bg-surface text-fg-2 ring-border hover:bg-surface-3",
      )}
    >
      {children}
      {count !== undefined && <span className={cn("tabular-nums", active ? "text-primary-foreground/80" : "text-subtle")}>{count}</span>}
    </button>
  );
}

export function PillRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

export function SelectField({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-8 text-sm text-fg-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
    </label>
  );
}

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
