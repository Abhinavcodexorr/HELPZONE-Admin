"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterGroup, FilterToolbar, Pill, PillRow, SelectField } from "@/components/ui/filters";
import { formatDate } from "@/lib/utils";
import { labelForCategory } from "@/lib/map-provider";
import {
  applyCustomerFilters,
  customerPresetLabel,
  customerSorts,
  datePresets,
  defaultCustomerFilters,
  type CustomerFilters,
} from "@/lib/list-filters";
import type { User, UserDetail, UserStatus } from "@/types";
import { BlockUserModal } from "./BlockUserModal";
import { CustomerCard } from "./CustomerCard";
import { UserDetailModal } from "./UserDetailModal";

const statusLabel: Record<UserStatus, string> = { active: "Active", inactive: "Blocked" };

export function UsersTable({
  users,
  busyIds,
  onBlock,
  onUnblock,
  loadDetail,
}: {
  users: User[];
  busyIds: Set<string>;
  onBlock: (ids: string[], reason: string, until: string | null) => Promise<void>;
  onUnblock: (ids: string[]) => Promise<void>;
  loadDetail: (id: string) => Promise<UserDetail>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [blockingIds, setBlockingIds] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CustomerFilters>(defaultCustomerFilters);
  const patch = (next: Partial<CustomerFilters>) => setFilters((f) => ({ ...f, ...next }));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    queueMicrotask(() => setNow(Date.now()));
  }, [users, filters.joined]);

  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      withPlan: users.filter((u) => u.currentPlan).length,
      cities: [...new Set(users.map((u) => u.city).filter((c) => c && c !== "—"))].sort((a, b) => a.localeCompare(b)),
    }),
    [users],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q
      ? users.filter((u) => [u.name, u.email, u.phone, u.city, u.currentPlan?.planName].some((field) => (field ?? "").toLowerCase().includes(q)))
      : users;
    return applyCustomerFilters(matching, filters, now);
  }, [users, query, filters, now]);

  const chips = [
    ...(filters.status !== "all" ? [{ key: "status", label: filters.status === "active" ? "Active" : "Blocked", onRemove: () => patch({ status: "all" }) }] : []),
    ...(filters.plan !== "any" ? [{ key: "plan", label: filters.plan === "with" ? "Has a plan" : "No plan", onRemove: () => patch({ plan: "any" }) }] : []),
    ...(filters.city ? [{ key: "city", label: filters.city, onRemove: () => patch({ city: "" }) }] : []),
    ...(filters.joined !== "any" ? [{ key: "joined", label: `Joined: ${customerPresetLabel(filters.joined)}`, onRemove: () => patch({ joined: "any" }) }] : []),
  ];
  const clearFilters = () => setFilters((f) => ({ ...defaultCustomerFilters, sort: f.sort }));
  const filtersActive = chips.length > 0 || query.trim() !== "";

  const selectedUsers = users.filter((u) => selected.has(u.id));
  const allShownSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allShownSelected ? new Set() : new Set(filtered.map((u) => u.id)));

  function exportCsv() {
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["Name", "Email", "Phone", "City", "State", "Address", "Looking for", "Bookings", "Plan", "Plan expires", "Joined", "Status", "Block reason"],
      ...filtered.map((u) => [
        u.name,
        u.email,
        u.phone,
        u.city,
        u.state,
        u.address,
        u.lookingFor.map(labelForCategory).join("; "),
        u.bookings,
        u.currentPlan?.planName ?? "",
        u.currentPlan ? formatDate(u.currentPlan.expiresAt) : "",
        formatDate(u.joinedAt),
        statusLabel[u.status],
        u.blockReason,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const viewingUser = users.find((u) => u.id === viewingId);
  const blockingUsers = blockingIds ? users.filter((u) => blockingIds.includes(u.id)) : [];

  return (
    <Card>
      <div className="border-b border-border p-4">
        <FilterToolbar
          query={query}
          onQuery={setQuery}
          placeholder="Search name, email, phone, plan..."
          sort={filters.sort}
          sortOptions={customerSorts}
          onSort={(sort) => patch({ sort })}
          chips={chips}
          onClear={clearFilters}
          quick={(["all", "active", "inactive"] as const).map((value) => (
            <Pill key={value} active={filters.status === value} onClick={() => patch({ status: value })} count={counts[value]}>
              {value === "all" ? "All" : value === "active" ? "Active" : "Blocked"}
            </Pill>
          ))}
          panel={
            <>
              <FilterGroup label="Plan">
                <PillRow>
                  <Pill active={filters.plan === "with"} onClick={() => patch({ plan: filters.plan === "with" ? "any" : "with" })} count={counts.withPlan}>
                    Has a plan
                  </Pill>
                  <Pill active={filters.plan === "none"} onClick={() => patch({ plan: filters.plan === "none" ? "any" : "none" })} count={counts.all - counts.withPlan}>
                    No plan
                  </Pill>
                </PillRow>
              </FilterGroup>
              <FilterGroup label="City">
                <SelectField
                  label="City"
                  value={filters.city}
                  onChange={(city) => patch({ city })}
                  options={[{ value: "", label: "All cities" }, ...counts.cities.map((c) => ({ value: c, label: c }))]}
                />
              </FilterGroup>
              <FilterGroup label="Joined">
                <SelectField label="Joined" value={filters.joined} onChange={(joined) => patch({ joined: joined as CustomerFilters["joined"] })} options={datePresets} />
              </FilterGroup>
            </>
          }
        />
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary-soft px-4 py-2.5 text-sm">
          <span className="font-semibold text-primary">{selectedUsers.length} selected</span>
          <Button size="sm" variant="danger" onClick={() => setBlockingIds(selectedUsers.filter((u) => u.status === "active").map((u) => u.id))} disabled={!selectedUsers.some((u) => u.status === "active")}>
            <Ban className="h-3.5 w-3.5" /> Block
          </Button>
          <Button
            size="sm"
            variant="success"
            onClick={async () => {
              await onUnblock(selectedUsers.filter((u) => u.status === "inactive").map((u) => u.id));
              setSelected(new Set());
            }}
            disabled={!selectedUsers.some((u) => u.status === "inactive")}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Unblock
          </Button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-muted hover:text-foreground">
            Clear selection
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs text-muted">
        <input type="checkbox" checked={allShownSelected} onChange={toggleAll} aria-label="Select all shown customers" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" />
        <span>Select all shown</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-subtle">
          No customers match your filters.
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                clearFilters();
              }}
              className="font-semibold text-primary hover:underline"
            >
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => (
            <CustomerCard
              key={u.id}
              user={u}
              busy={busyIds.has(u.id)}
              selected={selected.has(u.id)}
              onSelect={() => toggleOne(u.id)}
              onOpen={() => setViewingId(u.id)}
              onToggle={() => (u.status === "inactive" ? onUnblock([u.id]) : setBlockingIds([u.id]))}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
        <span>
          Showing {filtered.length} of {users.length} customers
        </span>
        <button onClick={exportCsv} disabled={filtered.length === 0} className="flex items-center gap-1.5 font-semibold text-fg-2 hover:text-primary disabled:opacity-50">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {viewingUser && (
        <UserDetailModal
          user={viewingUser}
          busy={busyIds.has(viewingUser.id)}
          loadDetail={loadDetail}
          onClose={() => setViewingId(null)}
          onBlock={() => setBlockingIds([viewingUser.id])}
          onUnblock={() => onUnblock([viewingUser.id])}
        />
      )}

      {blockingIds && blockingUsers.length > 0 && (
        <BlockUserModal
          names={blockingUsers.map((u) => u.name)}
          onCancel={() => setBlockingIds(null)}
          onConfirm={async (reason, until) => {
            await onBlock(blockingIds, reason, until);
            setBlockingIds(null);
            setSelected(new Set());
          }}
        />
      )}
    </Card>
  );
}
