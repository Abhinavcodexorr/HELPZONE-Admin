import { notFound } from "next/navigation";
import { HardHat } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProvidersTable } from "@/components/providers/ProvidersTable";
import { stageBySlug } from "@/lib/provider-stages";

export default async function ProviderStagePage({ params }: { params: Promise<{ stage: string }> }) {
  const stage = stageBySlug((await params).stage);
  if (!stage) notFound();

  return (
    <div>
      <PageHeader
        icon={HardHat}
        title="Providers"
        description="Maids, cooks, plumbers and other service professionals on the platform"
      />
      <ProvidersTable status={stage.status} />
    </div>
  );
}
