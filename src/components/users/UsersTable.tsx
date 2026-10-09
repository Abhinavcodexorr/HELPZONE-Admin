"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
import { User, UserStatus } from "@/types";

const statusTone: Record<UserStatus, "green" | "gray" | "red"> = {
  active: "green",
  inactive: "gray",
  suspended: "red",
};

const filters: { label: string; value: UserStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

export function UsersTable({ users }: { users: User[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<UserStatus | "all">("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.city.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || u.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [users, query, status]);

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                status === f.value
                  ? "bg-primary text-white"
                  : "bg-surface-3 text-fg-2 hover:bg-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Search users..." />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-subtle">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} color={u.avatarColor} />
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-subtle">{u.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-fg-2">{u.email}</p>
                  <p className="text-xs text-subtle">{u.phone}</p>
                </td>
                <td className="px-4 py-3 text-fg-2">{u.city}</td>
                <td className="px-4 py-3 text-fg-2">{u.bookings}</td>
                <td className="px-4 py-3 text-muted">{formatDate(u.joinedAt)}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[u.status]}>{u.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded-lg p-1.5 text-subtle hover:bg-surface-3 hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-subtle">
                  No users match your filters.
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
      </div>
    </Card>
  );
}
