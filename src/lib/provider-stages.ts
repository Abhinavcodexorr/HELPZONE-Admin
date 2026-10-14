import { CheckCircle2, Inbox, ShieldCheck, XCircle, type LucideIcon } from "lucide-react";
import type { ProviderStatus } from "@/types";

export interface ProviderStage {
  slug: string;
  label: string;
  status: ProviderStatus;
  icon: LucideIcon;
}

// Order here is the order shown in the sidebar and in the Providers tabs.
export const providerStages: ProviderStage[] = [
  { slug: "new", label: "New Request", status: "pending", icon: Inbox },
  { slug: "verification", label: "Verification", status: "verification", icon: ShieldCheck },
  { slug: "approved", label: "Approved", status: "approved", icon: CheckCircle2 },
  { slug: "rejected", label: "Rejected", status: "rejected", icon: XCircle },
];

export const stageBySlug = (slug: string) => providerStages.find((s) => s.slug === slug);
