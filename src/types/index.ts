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

export interface Provider {
  id: string;
  fullName: string;
  gender: "Male" | "Female";
  nationality: string;
  avatarColor: string;
  category: ServiceCategory;
  categoryId: string;
  area: string;
  city: string;
  mobileNumber: string;
  whatsappNumber: string;
  email: string;
  experienceYears: number;
  isActive: boolean;
  submittedAt: string;
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
  categoryId: string;
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
