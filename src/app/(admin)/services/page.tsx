import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ServicesGrid } from "@/components/services/ServicesGrid";
import type { Service } from "@/types";

const services: Service[] = [];

export default function ServicesPage() {
  return (
    <div>
      <PageHeader
        title="Services"
        description="Manage the service categories offered on the platform"
      />
      {services.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No services yet"
          description="Service categories will appear here once the services API is connected."
        />
      ) : (
        <ServicesGrid initialServices={services} />
      )}
    </div>
  );
}
