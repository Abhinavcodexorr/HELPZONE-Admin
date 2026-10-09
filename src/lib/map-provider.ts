import { Provider } from "@/types";

export interface BackendProvider {
  id: string;
  email: string;
  fullName: string;
  gender?: string;
  nationality?: string;
  categoryId?: string;
  area?: string;
  city?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  experienceYears?: number;
  imageUrl?: string;
  kyc?: { idType?: string; idNumber?: string; idDocumentUrl?: string };
  applicationStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  isActive?: boolean;
  createdAt: string;
}

// categoryId is free text set by the public registration form (see the
// `register-provider` page in the main site) — map the known ids to a
// friendly label and fall back to title-casing anything unrecognized.
const CATEGORY_LABELS: Record<string, string> = {
  "cat-cook": "Cook",
  "cat-maid": "Maid",
  "cat-plumber": "Plumber",
  "cat-electrician": "Electrician",
  "cat-carpenter": "Carpenter",
  "cat-driver": "Driver",
  "cat-babysitter": "Nanny",
  "cat-elderly-care": "Elderly Care",
  "cat-painter": "Painter",
};

function labelForCategory(categoryId?: string): string {
  if (!categoryId) return "Unspecified";
  if (CATEGORY_LABELS[categoryId]) return CATEGORY_LABELS[categoryId];
  return categoryId
    .replace(/^cat-/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const AVATAR_COLORS = [
  "#6366f1", "#06b6d4", "#a855f7", "#22c55e", "#eab308",
  "#ec4899", "#3b82f6", "#f43f5e", "#14b8a6", "#8b5cf6", "#f97316", "#0ea5e9",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function mapToProvider(provider: BackendProvider): Provider {
  return {
    id: provider.id,
    fullName: provider.fullName,
    gender: provider.gender === "Male" ? "Male" : "Female",
    nationality: provider.nationality || "—",
    avatarColor: colorForId(provider.id),
    category: labelForCategory(provider.categoryId),
    categoryId: provider.categoryId || "",
    area: provider.area || "—",
    city: provider.city || "—",
    mobileNumber: provider.mobileNumber || "—",
    whatsappNumber: provider.whatsappNumber || "—",
    email: provider.email,
    experienceYears: provider.experienceYears ?? 0,
    isActive: provider.isActive ?? true,
    submittedAt: provider.createdAt,
    status: provider.applicationStatus,
    rejectionReason: provider.rejectionReason,
    kyc: {
      idType: provider.kyc?.idType || "—",
      idNumber: provider.kyc?.idNumber || "—",
      idDocumentImage: provider.kyc?.idDocumentUrl || "",
      photoImage: provider.imageUrl || "",
    },
  };
}
