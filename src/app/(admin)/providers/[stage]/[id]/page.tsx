"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProviderDetailView } from "@/components/providers/ProviderDetailView";
import { useProvider } from "@/components/providers/useProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { providerStages, stageBySlug, stageForStatus } from "@/lib/provider-stages";
import { useProviders } from "@/store/ProvidersContext";

export default function ProviderDetailPage() {
  const { stage: slug, id } = useParams<{ stage: string; id: string }>();
  const router = useRouter();
  const { verify, approve, reject } = useProviders();
  const { provider, loading, error, reload } = useProvider(id);
  const stage = stageBySlug(slug) ?? providerStages[0];

  // Run the action, reload the provider, and move to the stage it now belongs to.
  async function act(action: () => Promise<void>) {
    await action();
    const updated = await reload();
    const next = updated ? stageForStatus(updated.status) : null;
    if (next && next.slug !== slug) router.replace(`/providers/${next.slug}/${id}`);
  }

  if (loading) return <Skeleton className="mx-auto h-96 w-full max-w-4xl rounded-3xl" />;
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
  return (
    <ProviderDetailView
      provider={provider}
      backHref={`/providers/${current.slug}`}
      backLabel={current.label}
      editHref={`/providers/${current.slug}/${id}/edit`}
      onVerify={(pid) => act(() => verify(pid))}
      onApprove={(pid) => act(() => approve(pid))}
      onReject={(pid, reason) => act(() => reject(pid, reason))}
    />
  );
}
