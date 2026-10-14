import { LastJob, Provider } from "@/types";

export interface BackendProvider {
  id: string;
  email: string;
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
  profileComplete?: boolean;
  imageUrl?: string;
  kyc?: { idType?: string; idNumber?: string; idDocumentUrl?: string };
  applicationStatus: "pending" | "approved" | "rejected";
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
    categories: categoryIds.map(labelForCategory),
    city: provider.city || "—",
    state: provider.state || "",
    mobileNumber: provider.mobileNumber || "—",
    whatsappNumber: provider.whatsappNumber || "—",
    email: provider.email,
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
  };
}
