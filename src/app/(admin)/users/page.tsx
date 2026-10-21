"use client";

import { useCallback, useState } from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { UsersTable } from "@/components/users/UsersTable";
import { useUsers } from "@/components/users/useUsers";
import type { User } from "@/types";

export default function UsersPage() {
  const { users, loading, error, setActive } = useUsers();
  const [busyId, setBusyId] = useState<string | null>(null);

  const onToggleStatus = useCallback(
    async (user: User) => {
      setBusyId(user.id);
      try {
        await setActive(user.id, user.status !== "active");
      } finally {
        setBusyId(null);
      }
    },
    [setActive],
  );

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Users"
        description="Customers who book maids, cooks and other service providers"
      />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}
      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Customer accounts will appear here once families start signing up."
        />
      ) : (
        <UsersTable users={users} busyId={busyId} onToggleStatus={onToggleStatus} />
      )}
    </div>
  );
}
