import { PageHeader } from "@/components/ui/PageHeader";
import { UsersTable } from "@/components/users/UsersTable";

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="Users"
        description="Customers who book maids, cooks and other service providers"
      />
      <UsersTable />
    </div>
  );
}
