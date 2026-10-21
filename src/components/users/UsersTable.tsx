"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { FilterGroup, FilterToolbar, Pill, PillRow, SelectField, toggle } from "@/components/ui/filters";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { Ban, CheckCircle2, Download, Eye, Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BlockUserModal } from "./BlockUserModal";
import { UserDetailModal } from "./UserDetailModal";
import { DeleteUserModal, EditUserModal, FlagUserModal } from "./UserActionModals";
import type { User, UserDetail, UserNote, UserStatus } from "@/types";
import {
  applyUserFilters,
  bookingBuckets,
  datePresets,
  defaultUserFilters,
  userPresetLabel,
  userSorts,
  type UserFilters,
} from "@/lib/list-filters";

const statusTone: Record<UserStatus, "green" | "red"> = {
  active: "green",
  inactive: "red",
};

const statusLabel: Record<UserStatus, string> = { active: "Active", inactive: "Blocked" };

export function UsersTable({
  users,
  busyIds,
  onBlock,
  onUnblock,
  onFlag,
  onUpdate,
  onDelete,
  loadDetail,
  addNote,
  deleteNote,
}: {
  users: User[];
  busyIds: Set<string>;
  onBlock: (ids: string[], reason: string, until: string | null) => Promise<void>;
  onUnblock: (ids: string[]) => Promise<void>;
  onFlag: (ids: string[], flagged: boolean, reason: string) => Promise<void>;
  onUpdate: (id: string, input: { name: string; phone: string; emirate: string; address: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loadDetail: (id: string) => Promise<UserDetail>;
  addNote: (id: string, text: string) => Promise<UserNote[]>;
  deleteNote: (id: string, noteId: string) => Promise<UserNote[]>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [blockingIds, setBlockingIds] = useState<string[] | null>(null);
  const [flaggingIds, setFlaggingIds] = useState<string[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<UserFilters>(defaultUserFilters);
  const patch = (next: Partial<UserFilters>) => setFilters((f) => ({ ...f, ...next }));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    queueMicrotask(() => setNow(Date.now()));
  }, [users, filters.joined]);

  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      flagged: users.filter((u) => u.flagged).length,
      cities: [...new Set(users.map((u) => u.city).filter((c) => c && c !== "—"))].sort((a, b) => a.localeCompare(b)),
      bookings: Object.fromEntries(bookingBuckets.map((b) => [b.value, users.filter((u) => b.test(u.bookings)).length])),
    }),
    [users],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q
      ? users.filter((u) => [u.name, u.email, u.phone, u.city].some((field) => (field ?? "").toLowerCase().includes(q)))
      : users;
    return applyUserFilters(matching, filters, now);
  }, [users, query, filters, now]);

  const chips = [
    ...(filters.status !== "all"
      ? [{ key: "status", label: filters.status === "active" ? "Active" : "Blocked", onRemove: () => patch({ status: "all" }) }]
      : []),
    ...(filters.flaggedOnly ? [{ key: "flagged", label: "Flagged", onRemove: () => patch({ flaggedOnly: false }) }] : []),
    ...(filters.city ? [{ key: "city", label: filters.city, onRemove: () => patch({ city: "" }) }] : []),
    ...filters.bookings.map((b) => ({
      key: `bookings-${b}`,
      label: bookingBuckets.find((x) => x.value === b)!.label,
      onRemove: () => patch({ bookings: filters.bookings.filter((x) => x !== b) }),
    })),
    ...(filters.joined !== "any"
      ? [{ key: "joined", label: `Joined: ${userPresetLabel(filters.joined)}`, onRemove: () => patch({ joined: "any" }) }]
      : []),
  ];
  const clearFilters = () => setFilters((f) => ({ ...defaultUserFilters, sort: f.sort }));
  const filtersActive = chips.length > 0 || query.trim() !== "";

  // Selection only ever holds users that still exist.
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
      ["Name", "Email", "Phone", "City", "Address", "Bookings", "Joined", "Status", "Blocked until", "Block reason", "Flagged", "Flag reason"],
      ...filtered.map((u) => [u.name, u.email, u.phone, u.city, u.address, u.bookings, formatDate(u.joinedAt), statusLabel[u.status], u.blockedUntil ? formatDate(u.blockedUntil) : "", u.blockReason, u.flagged ? "Yes" : "", u.flagReason]),
    ];
    const blob = new Blob([rows.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const viewingUser = users.find((u) => u.id === viewingId);
  const blockingUsers = blockingIds ? users.filter((u) => blockingIds.includes(u.id)) : [];
  const flaggingUsers = flaggingIds ? users.filter((u) => flaggingIds.includes(u.id)) : [];
  const editingUser = users.find((u) => u.id === editingId);
  const deletingUser = users.find((u) => u.id === deletingId);

  return (
    <Card>
      <div className="border-b border-border p-4">
        <FilterToolbar
          query={query}
          onQuery={setQuery}
          placeholder="Search name, email, phone, city..."
          sort={filters.sort}
          sortOptions={userSorts}
          onSort={(sort) => patch({ sort })}
          chips={chips}
          onClear={clearFilters}
          quick={
            <>
              {(["all", "active", "inactive"] as const).map((value) => (
                <Pill key={value} active={filters.status === value} onClick={() => patch({ status: value })} count={counts[value]}>
                  {value === "all" ? "All" : value === "active" ? "Active" : "Blocked"}
                </Pill>
              ))}
              <span className="mx-1 h-5 w-px bg-border" aria-hidden />
              <Pill active={filters.flaggedOnly} onClick={() => patch({ flaggedOnly: !filters.flaggedOnly })} count={counts.flagged}>
                <Flag className="h-3 w-3" /> Flagged
              </Pill>
            </>
          }
          panel={
            <>
              <FilterGroup label="City">
                <SelectField
                  label="City"
                  value={filters.city}
                  onChange={(city) => patch({ city })}
                  options={[{ value: "", label: "All cities" }, ...counts.cities.map((c) => ({ value: c, label: c }))]}
                />
              </FilterGroup>
              <FilterGroup label="Bookings">
                <PillRow>
                  {bookingBuckets.map((b) => (
                    <Pill key={b.value} active={filters.bookings.includes(b.value)} onClick={() => patch({ bookings: toggle(filters.bookings, b.value) })} count={counts.bookings[b.value]}>
                      {b.label}
                    </Pill>
                  ))}
                </PillRow>
              </FilterGroup>
              <FilterGroup label="Joined">
                <SelectField label="Joined" value={filters.joined} onChange={(joined) => patch({ joined: joined as UserFilters["joined"] })} options={datePresets} />
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
          <Button size="sm" variant="secondary" onClick={() => setFlaggingIds(selectedUsers.filter((u) => !u.flagged).map((u) => u.id))} disabled={!selectedUsers.some((u) => !u.flagged)}>
            <Flag className="h-3.5 w-3.5" /> Flag
          </Button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-muted hover:text-foreground">
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-subtle">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allShownSelected} onChange={toggleAll} aria-label="Select all shown users" className="h-4 w-4 cursor-pointer accent-[var(--primary)]" />
              </th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const blocked = u.status === "inactive";
              const busy = busyIds.has(u.id);
              return (
                <tr
                  key={u.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button, a, input")) return;
                    setViewingId(u.id);
                  }}
                  className={`cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-2 ${blocked ? "bg-danger-soft/30" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} aria-label={`Select ${u.name}`} className="h-4 w-4 cursor-pointer accent-[var(--primary)]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} color={u.avatarColor} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
                          {u.name}
                          {u.flagged && <Flag className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" aria-label="Flagged" />}
                        </p>
                        <p className="truncate text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-fg-2">{u.phone}</td>
                  <td className="px-4 py-3 text-fg-2">{u.city}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-fg-2">{u.bookings}</p>
                    <p className="text-xs text-muted">{u.lastBookingAt ? `Last ${formatDate(u.lastBookingAt)}` : "None yet"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(u.joinedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[u.status]} dot>
                      {statusLabel[u.status]}
                    </Badge>
                    {blocked && (
                      <p className="mt-1 max-w-[170px] truncate text-[11px] text-muted" title={u.blockReason}>
                        {u.blockedUntil ? `Until ${formatDate(u.blockedUntil)}` : "Until unblocked"}
                        {u.blockReason ? ` · ${u.blockReason}` : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewingId(u.id)} aria-label={`View ${u.name}`} title="View details" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-3 hover:text-foreground active:scale-90">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => (u.flagged ? onFlag([u.id], false, "") : setFlaggingIds([u.id]))}
                        aria-label={u.flagged ? `Remove flag from ${u.name}` : `Flag ${u.name}`}
                        title={u.flagged ? "Remove flag" : "Flag for attention"}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-surface-3 active:scale-90 ${u.flagged ? "text-amber-500" : "text-muted hover:text-foreground"}`}
                      >
                        <Flag className={`h-4 w-4 ${u.flagged ? "fill-amber-400" : ""}`} />
                      </button>
                      {blocked ? (
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => onUnblock([u.id])}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> {busy ? "…" : "Unblock"}
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => setBlockingIds([u.id])} className="text-danger">
                          <Ban className="h-3.5 w-3.5" /> Block
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-subtle">
                  <span className="flex flex-col items-center gap-2">
                    No users match your filters.
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
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
        <span>
          Showing {filtered.length} of {users.length} users
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
          onFlag={() => setFlaggingIds([viewingUser.id])}
          onUnflag={() => onFlag([viewingUser.id], false, "")}
          onEdit={() => setEditingId(viewingUser.id)}
          onDelete={() => setDeletingId(viewingUser.id)}
          addNote={addNote}
          deleteNote={deleteNote}
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

      {flaggingIds && flaggingUsers.length > 0 && (
        <FlagUserModal
          names={flaggingUsers.map((u) => u.name)}
          onCancel={() => setFlaggingIds(null)}
          onConfirm={async (reason) => {
            await onFlag(flaggingIds, true, reason);
            setFlaggingIds(null);
            setSelected(new Set());
          }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onCancel={() => setEditingId(null)}
          onSave={async (input) => {
            await onUpdate(editingUser.id, input);
            setEditingId(null);
          }}
        />
      )}

      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => {
            await onDelete(deletingUser.id);
            setDeletingId(null);
            setViewingId(null);
          }}
        />
      )}
    </Card>
  );
}
