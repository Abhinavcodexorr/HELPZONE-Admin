import { PageHeader } from "@/components/ui/PageHeader";
import { ProvidersTable } from "@/components/providers/ProvidersTable";

export default function ProvidersPage() {
  return (
    <div>
      <PageHeader
        title="Providers"
        description="Maids, cooks, plumbers and other service professionals on the platform"
      />
      <ProvidersTable />
    </div>
  );
}
