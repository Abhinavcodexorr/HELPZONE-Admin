import { LastJob, Provider } from "@/types";
import { colorForId } from "@/lib/utils";

export interface BackendProvider {
  id: string;
  email?: string;
  fullName?: string;
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
  panCardUrl?: string;
  aadhaarNumber?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  introVideoUrl?: string;
  introVideoThumbnailUrl?: string;
  serviceRadiusKm?: number;
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
  const documents = mapDocuments(provider);
  const categoryIds = provider.categoryIds?.length
    ? provider.categoryIds
    : provider.categoryId
      ? [provider.categoryId]
      : [];

  return {
    id: provider.id,
    // Phone-only signups have no name until they finish their profile.
    fullName: provider.fullName?.trim() || "Unnamed provider",
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
    serviceRadiusKm: provider.serviceRadiusKm ?? null,
    profileComplete: provider.profileComplete ?? false,
    isActive: provider.isActive ?? true,
    submittedAt: provider.createdAt,
    updatedAt: provider.updatedAt ?? provider.createdAt,
    status: provider.applicationStatus,
    rejectionReason: provider.rejectionReason,
    kyc: mapKyc(provider, documents),
    panCard: mapPanCard(provider),
    documents,
  };
}

// The primary ID proof shown in the listing's Aadhaar column: the first non-PAN document
// (the Aadhaar front in the new flow, the first kycDocuments entry in older records).
function mapKyc(provider: BackendProvider, documents: Provider["documents"]): Provider["kyc"] {
  const primary = documents.find((d) => !/pan/i.test(d.type));
  const isAadhaar = primary ? /aadhaar/i.test(primary.type) : false;
  const back = isAadhaar ? documents.find((d) => /aadhaar.*back/i.test(d.type)) : undefined;
  return {
    idType: primary ? (isAadhaar ? "Aadhaar Card" : primary.type) : "—",
    idNumber: primary?.number || "—",
    idDocumentImage: primary?.image || "",
    idDocumentBackImage: back?.image || "",
    photoImage: provider.imageUrl || "",
  };
}

// One entry per submitted document, so each type (Aadhaar front/back, PAN card…)
// is shown on its own. The new KYC flow sends explicit aadhaar/pan fields; the
// old kycDocuments array is kept for records submitted before that flow.
function mapDocuments(provider: BackendProvider): Provider["documents"] {
  const docs: Provider["documents"] = [];
  if (provider.aadhaarFrontUrl || provider.aadhaarNumber) {
    docs.push({ type: "Aadhaar Front", number: provider.aadhaarNumber || "", image: provider.aadhaarFrontUrl || "" });
  }
  if (provider.aadhaarBackUrl) {
    docs.push({ type: "Aadhaar Back", number: provider.aadhaarNumber || "", image: provider.aadhaarBackUrl });
  }
  (provider.kycDocuments ?? [])
    .filter((d) => d.idType || d.idNumber || d.idDocumentUrl)
    .forEach((d) => docs.push({ type: d.idType?.trim() || "ID document", number: d.idNumber?.trim() || "", image: d.idDocumentUrl || "" }));
  // A PAN number/card can be on the profile without a legacy kycDocuments row.
  if ((provider.panNumber || provider.panCardUrl) && !docs.some((d) => /pan/i.test(d.type))) {
    docs.push({ type: "PAN Card", number: provider.panNumber || "", image: provider.panCardUrl || "" });
  }
  return docs;
}

// New flow: explicit panCardUrl/panNumber. Old flow: a kycDocuments entry typed as PAN.
function mapPanCard(provider: BackendProvider): Provider["panCard"] {
  if (provider.panCardUrl) {
    return { idNumber: provider.panNumber || "—", idDocumentImage: provider.panCardUrl };
  }
  const pan = provider.kycDocuments?.find((d) => /pan/i.test(d.idType ?? ""));
  if (!pan?.idDocumentUrl) return null;
  return { idNumber: pan.idNumber || "—", idDocumentImage: pan.idDocumentUrl };
}
