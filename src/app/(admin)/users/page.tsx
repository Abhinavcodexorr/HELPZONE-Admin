"use client";

import { useCallback, useMemo, useState } from "react";
import { Ban, Flag, UserCheck, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { UsersTable } from "@/components/users/UsersTable";
import { useUsers } from "@/components/users/useUsers";

const WEEK = 7 * 86_400_000;

export default function UsersPage() {
  const { users, loading, error, block, unblock, flag, update, remove, addNote, deleteNote, loadDetail } = useUsers();
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  // Runs the action for each user in turn and reports how many failed, so one bad id doesn't hide the rest.
  const runBatch = useCallback(async (ids: string[], action: (id: string) => Promise<void>, verb: string) => {
    setActionError(null);
    setBusyIds((prev) => new Set([...prev, ...ids]));
    let failed = 0;
    for (const id of ids) {
      try {
        await action(id);
      } catch {
        failed += 1;
      }
    }
    setBusyIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    if (failed > 0) {
      const message = `${failed} of ${ids.length} user${ids.length === 1 ? "" : "s"} couldn't be ${verb}. Try again.`;
      setActionError(message);
      if (failed === ids.length) throw new Error(message);
    }
  }, []);

  const onBlock = useCallback(
    (ids: string[], reason: string, until: string | null) => runBatch(ids, (id) => block(id, reason, until), "blocked"),
    [runBatch, block],
  );
  const onUnblock = useCallback((ids: string[]) => runBatch(ids, (id) => unblock(id), "unblocked").catch(() => undefined), [runBatch, unblock]);
  const onFlag = useCallback(
    (ids: string[], flagged: boolean, reason: string) =>
      runBatch(ids, (id) => flag(id, flagged, reason), flagged ? "flagged" : "unflagged").catch((err) => {
        if (flagged) throw err;
      }),
    [runBatch, flag],
  );

  const stats = useMemo(
    () => [
      { label: "Total users", value: users.length, icon: Users, tone: "bg-primary-soft text-primary" },
      { label: "Active", value: users.filter((u) => u.status === "active").length, icon: UserCheck, tone: "bg-success-soft text-success" },
      { label: "Blocked", value: users.filter((u) => u.status === "inactive").length, icon: Ban, tone: "bg-danger-soft text-danger" },
      { label: "Flagged", value: users.filter((u) => u.flagged).length, icon: Flag, tone: "bg-warning-soft text-warning" },
      { label: "New this week", value: users.filter((u) => new Date(u.joinedAt).getTime() >= now - WEEK).length, icon: UserPlus, tone: "bg-info-soft text-info" },
    ],
    [users, now],
  );

  return (
    <div>
      <PageHeader icon={Users} title="Users" description="Customers who book maids, cooks and other service providers" />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
      )}
      {actionError && <div className="mb-4 rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">{actionError}</div>}

      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users yet" description="Customer accounts will appear here once families start signing up." />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-2xl bg-surface p-4 ring-1 ring-border">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-semibold tabular-nums leading-tight text-foreground">{s.value}</p>
                  <p className="truncate text-xs text-muted">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          <UsersTable
            users={users}
            busyIds={busyIds}
            onBlock={onBlock}
            onUnblock={onUnblock}
            onFlag={onFlag}
            onUpdate={update}
            onDelete={remove}
            loadDetail={loadDetail}
            addNote={addNote}
            deleteNote={deleteNote}
          />
        </>
      )}
    </div>
  );
}
