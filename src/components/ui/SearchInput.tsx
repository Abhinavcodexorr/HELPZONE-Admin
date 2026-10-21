"use client";

import { Search } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  fullWidth = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Stretch to the container instead of the default fixed width. */
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "relative w-full" : "relative"}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-fg-2 placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${fullWidth ? "" : "sm:w-64"}`}
      />
    </div>
  );
}
