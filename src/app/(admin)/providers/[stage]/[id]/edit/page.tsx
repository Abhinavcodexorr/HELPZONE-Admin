"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProviderEditForm } from "@/components/providers/ProviderEditForm";
import { useProvider } from "@/components/providers/useProvider";
import { useServices } from "@/components/services/useServices";
import { Skeleton } from "@/components/ui/Skeleton";
import { providerStages, stageBySlug, stageForStatus } from "@/lib/provider-stages";
import { useProviders } from "@/store/ProvidersContext";

export default function ProviderEditPage() {
  const { stage: slug, id } = useParams<{ stage: string; id: string }>();
  const router = useRouter();
  const { update } = useProviders();
  const { provider, loading, error } = useProvider(id);
  const { services, loading: servicesLoading } = useServices();
  const stage = stageBySlug(slug) ?? providerStages[0];

  if (loading || servicesLoading) return <Skeleton className="mx-auto h-96 w-full max-w-3xl rounded-2xl" />;
  if (error || !provider) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-surface p-8 text-center ring-1 ring-border">
        <p className="text-sm font-semibold text-foreground">{error ?? "Provider not found"}</p>
        <Link href={`/providers/${stage.slug}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          Back to {stage.label}
        </Link>
      </div>
    );
  }

  const current = stageForStatus(provider.status) ?? stage;
  const detailsHref = `/providers/${current.slug}/${id}`;
  return (
    <ProviderEditForm
      provider={provider}
      services={services}
      backHref={detailsHref}
      onSave={async (input) => {
        await update(id, input);
        router.push(detailsHref);
      }}
    />
  );
}
