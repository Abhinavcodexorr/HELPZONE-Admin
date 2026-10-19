import { LastJob, Provider } from "@/types";

export interface BackendProvider {
  id: string;
  email?: string;
  fullName: string;
  gender?: string;
  nationality?: string;
  // Older records only have the single `categoryId`; newer ones use the array.
  categoryIds?: string[];
  categoryId?: string;
  city?: string;
  state?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  age?: number;
  maritalStatus?: string;
  religion?: string;
  languages?: string[];
  skills?: string[];
  bio?: string;
  education?: string;
  certificate?: string;
  experienceYears?: number;
  monthlySalary?: number;
  preferredJob?: string;
  duration?: string;
  availability?: string;
  jobDescription?: string;
  lastWorkingExperience?: Partial<LastJob>;
  emirate?: string;
  panNumber?: string;
  introVideoUrl?: string;
  introVideoThumbnailUrl?: string;
  profileComplete?: boolean;
  imageUrl?: string;
  kyc?: { idType?: string; idNumber?: string; idDocumentUrl?: string };
  // Full list of KYC documents the provider submitted (kyc above is just the
  // first one) — a PAN card, if submitted, shows up here as its own entry.
  kycDocuments?: { idType?: string; idNumber?: string; idDocumentUrl?: string }[];
  applicationStatus: "pending" | "verification" | "approved" | "rejected";
  rejectionReason?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Category ids are free text set by the registration form — map the known ids
// to a friendly label and title-case anything unrecognized.
const CATEGORY_LABELS: Record<string, string> = {
  "cat-cook": "Cook",
  "cat-maid": "Maid",
  "cat-plumber": "Plumber",
  "cat-electrician": "Electrician",
  "cat-carpenter": "Carpenter",
  "cat-driver": "Driver",
  "cat-babysitter": "Nanny",
  "cat-nanny": "Nanny",
  "cat-elderly-care": "Elderly Care",
  "cat-painter": "Painter",
};

export function labelForCategory(categoryId: string): string {
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

function mapLastJob(job?: Partial<LastJob>): LastJob | undefined {
  if (!job) return undefined;
  const mapped: LastJob = {
    jobTitle: job.jobTitle ?? "",
    duration: job.duration ?? "",
    workingCity: job.workingCity ?? "",
    reasonForLeaving: job.reasonForLeaving ?? "",
    familySize: job.familySize ?? "",
    employerNationality: job.employerNationality ?? "",
    salary: job.salary,
  };
  const hasAnything = Object.values(mapped).some((v) => v !== "" && v !== undefined);
  return hasAnything ? mapped : undefined;
}

export function mapToProvider(provider: BackendProvider): Provider {
  const categoryIds = provider.categoryIds?.length
    ? provider.categoryIds
    : provider.categoryId
      ? [provider.categoryId]
      : [];

  return {
    id: provider.id,
    fullName: provider.fullName,
    gender: provider.gender === "Male" ? "Male" : "Female",
    nationality: provider.nationality || "—",
    avatarColor: colorForId(provider.id),
    categoryIds,
    categories: [...new Set(categoryIds.map(labelForCategory))],
    city: provider.city || "—",
    state: provider.state || "",
    mobileNumber: provider.mobileNumber || "—",
    whatsappNumber: provider.whatsappNumber || "—",
    email: provider.email ?? "",
    age: provider.age,
    maritalStatus: provider.maritalStatus ?? "",
    religion: provider.religion ?? "",
    languages: provider.languages ?? [],
    skills: provider.skills ?? [],
    bio: provider.bio ?? "",
    education: provider.education ?? "",
    certificate: provider.certificate ?? "",
    experienceYears: provider.experienceYears ?? 0,
    monthlySalary: provider.monthlySalary,
    preferredJob: provider.preferredJob ?? "",
    duration: provider.duration ?? "",
    availability: provider.availability ?? "",
    jobDescription: provider.jobDescription ?? "",
    lastJob: mapLastJob(provider.lastWorkingExperience),
    emirate: provider.emirate ?? "",
    panNumber: provider.panNumber ?? "",
    introVideoUrl: provider.introVideoUrl ?? "",
    introVideoThumbnailUrl: provider.introVideoThumbnailUrl ?? "",
    profileComplete: provider.profileComplete ?? false,
    isActive: provider.isActive ?? true,
    submittedAt: provider.createdAt,
    updatedAt: provider.updatedAt ?? provider.createdAt,
    status: provider.applicationStatus,
    rejectionReason: provider.rejectionReason,
    kyc: {
      idType: provider.kyc?.idType || "—",
      idNumber: provider.kyc?.idNumber || "—",
      idDocumentImage: provider.kyc?.idDocumentUrl || "",
      photoImage: provider.imageUrl || "",
    },
    panCard: mapPanCard(provider.kycDocuments),
    documents: mapDocuments(provider),
  };
}

// One entry per submitted document, so each type (Aadhaar, PAN card…) is shown on its own.
function mapDocuments(provider: BackendProvider): Provider["documents"] {
  const docs = (provider.kycDocuments ?? [])
    .filter((d) => d.idType || d.idNumber || d.idDocumentUrl)
    .map((d) => ({ type: d.idType?.trim() || "ID document", number: d.idNumber?.trim() || "", image: d.idDocumentUrl || "" }));
  // A PAN number can be on the profile without a PAN document row.
  if (provider.panNumber && !docs.some((d) => /pan/i.test(d.type))) {
    docs.push({ type: "PAN Card", number: provider.panNumber, image: "" });
  }
  return docs;
}

// Finds the kycDocuments entry (if any) that is a PAN card, by idType.
function mapPanCard(docs?: BackendProvider["kycDocuments"]): Provider["panCard"] {
  const pan = docs?.find((d) => /pan/i.test(d.idType ?? ""));
  if (!pan?.idDocumentUrl) return null;
  return { idNumber: pan.idNumber || "—", idDocumentImage: pan.idDocumentUrl };
}
