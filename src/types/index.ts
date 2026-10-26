// The backend's User model only has `isActive` — no separate "suspended"
// state exists, so this type doesn't offer one either.
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarColor: string;
  city: string;
  address: string;
  state: string;
  /** Service keys they are looking for. */
  lookingFor: string[];
  requirementType: string;
  bookings: number;
  lastBookingAt: string | null;
  joinedAt: string;
  /** "inactive" is a blocked account (it can't sign in or book). */
  status: UserStatus;
  blockedAt: string | null;
  blockReason: string;
  /** A timed block ends by itself at this moment; null = until an admin unblocks. */
  blockedUntil: string | null;
  /** The plan they are on right now; null = none. */
  currentPlan: Subscription | null;
}

/** A plan a customer bought (name, price and length are as they were at purchase). */
export interface Subscription {
  id: string;
  planName: string;
  price: number;
  originalPrice: number | null;
  durationDays: number;
  startsAt: string;
  expiresAt: string;
  status: "active" | "upcoming" | "expired" | "cancelled";
  daysLeft: number;
  paymentRef: string | null;
  source: "app" | "admin";
  boughtAt: string;
}

export interface UserDetail extends User {
  favouriteCount: number;
  subscription: { current: Subscription | null; upcoming: Subscription | null; history: Subscription[] };
}

// The real backend stores categoryId/idType as free text (no fixed enum
// shared across services), so these stay as `string` rather than a union —
// a hardcoded union would silently misrender any category/ID type the
// backend doesn't happen to match.
export type ServiceCategory = string;

export type ProviderStatus = "pending" | "verification" | "approved" | "rejected";

export type IdType = string;

export interface LastJob {
  jobTitle: string;
  duration: string;
  workingCity: string;
  reasonForLeaving: string;
  familySize: string;
  employerNationality: string;
  salary?: number;
}

// Text fields the backend leaves unset come through as "" and are rendered as
// an em dash by the UI, so "not provided" is always visible to the reviewer.
export interface Provider {
  id: string;
  fullName: string;
  gender: "Male" | "Female";
  nationality: string;
  avatarColor: string;
  categories: string[];
  categoryIds: string[];
  city: string;
  state: string;
  mobileNumber: string;
  whatsappNumber: string;
  email: string;
  age?: number;
  maritalStatus: string;
  religion: string;
  languages: string[];
  skills: string[];
  bio: string;
  education: string;
  certificate: string;
  experienceYears: number;
  monthlySalary?: number;
  preferredJob: string;
  duration: string;
  availability: string;
  jobDescription: string;
  lastJob?: LastJob;
  emirate: string;
  panNumber: string;
  introVideoUrl: string;
  /** Still frame of the intro video, made by the backend ("" if not available). */
  introVideoThumbnailUrl: string;
  profileComplete: boolean;
  isActive: boolean;
  submittedAt: string;
  updatedAt: string;
  status: ProviderStatus;
  rejectionReason?: string;
  kyc: {
    idType: IdType;
    idNumber: string;
    idDocumentImage: string;
    /** Back side, when the ID has one (Aadhaar). */
    idDocumentBackImage?: string;
    photoImage: string;
  };
  /** Every identity document the provider submitted (Aadhaar, PAN card, passport…), each with its own number and file. */
  documents: ProviderDocument[];
  /** A separate kycDocuments entry whose idType is a PAN card, if the provider submitted one. */
  panCard: {
    idNumber: string;
    idDocumentImage: string;
  } | null;
}

export interface ProviderDocument {
  type: string;
  number: string;
  image: string;
}

export interface UpdateProviderInput {
  fullName: string;
  gender: "Male" | "Female";
  nationality: string;
  categoryIds: string[];
  city: string;
  mobileNumber: string;
  whatsappNumber: string;
  email: string;
  experienceYears: number;
  kyc: {
    idType: string;
    idNumber: string;
  };
}

// A catalog entry managed under Services. Providers reference it by `key`
// (e.g. "cat-cook") in their categoryIds, so the key never changes after creation.
/** A second level under a service, e.g. "Window AC" under "AC Servicing". */
export interface SubCategory {
  key: string;
  name: string;
  isActive: boolean;
  /** Providers who picked it (admin listing only). */
  providerCount?: number;
}

export interface Service {
  id: string;
  key: string;
  name: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  subCategories?: SubCategory[];
  providerCount: number;
  approvedProviderCount: number;
  createdAt: string;
  updatedAt: string;
}

// A category id providers already use that has no catalog entry yet.
export interface DetectedCategory {
  key: string;
  providerCount: number;
  approvedProviderCount: number;
}

export interface ServiceInput {
  name: string;
  description: string;
  imageUrl: string;
  /** Full list on every save; entries that exist already must keep their `key`. */
  subCategories?: { key?: string; name: string; isActive: boolean }[];
  isActive?: boolean;
  /** Only sent when creating from a detected category. */
  key?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  durationDays: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanInput {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  durationDays: number;
  features: string[];
  isPopular?: boolean;
  sortOrder?: number;
}
