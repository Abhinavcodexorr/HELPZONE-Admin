export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarColor: string;
  city: string;
  bookings: number;
  joinedAt: string;
  status: UserStatus;
}

// The real backend stores categoryId/idType as free text (no fixed enum
// shared across services), so these stay as `string` rather than a union —
// a hardcoded union would silently misrender any category/ID type the
// backend doesn't happen to match.
export type ServiceCategory = string;

export type ProviderStatus = "pending" | "approved" | "rejected";

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
  area: string;
  city: string;
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
  preferredJob: string;
  duration: string;
  availability: string;
  jobDescription: string;
  lastJob?: LastJob;
  emirate: string;
  panNumber: string;
  introVideoUrl: string;
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
    photoImage: string;
  };
}

export interface UpdateProviderInput {
  fullName: string;
  gender: "Male" | "Female";
  nationality: string;
  categoryIds: string[];
  area: string;
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

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  basePrice: number;
  priceUnit: "hour" | "visit" | "month";
  activeProviders: number;
  bookingsThisMonth: number;
  isActive: boolean;
  icon: string;
}
