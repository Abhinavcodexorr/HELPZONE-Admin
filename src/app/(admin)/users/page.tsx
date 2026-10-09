import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { UsersTable } from "@/components/users/UsersTable";
import type { User } from "@/types";

const users: User[] = [];

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="Users"
        description="Customers who book maids, cooks and other service providers"
      />
      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Customer accounts will appear here once the users API is connected."
        />
      ) : (
        <UsersTable users={users} />
      )}
    </div>
  );
}
