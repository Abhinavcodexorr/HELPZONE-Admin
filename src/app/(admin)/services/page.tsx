import { PageHeader } from "@/components/ui/PageHeader";
import { ServicesGrid } from "@/components/services/ServicesGrid";

export default function ServicesPage() {
  return (
    <div>
      <PageHeader
        title="Services"
        description="Manage the service categories offered on the platform"
      />
      <ServicesGrid />
    </div>
  );
}
