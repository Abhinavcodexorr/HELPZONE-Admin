import type { User, UserStatus } from "@/types";
import { colorForId } from "@/lib/utils";

export interface BackendCustomer {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  emirate?: string;
  address?: string;
  isActive?: boolean;
  bookingCount?: number;
  lastBookingAt?: string | null;
  blockedAt?: string | null;
  blockReason?: string;
  blockedUntil?: string | null;
  flagged?: boolean;
  flagReason?: string;
  noteCount?: number;
  createdAt?: string;
}

// The User model has no "suspended" state distinct from inactive — a
// deactivated customer account is shown as "inactive" rather than this UI
// inventing a status nothing in the backend actually writes.
function statusFor(isActive?: boolean): UserStatus {
  return isActive === false ? "inactive" : "active";
}

export function mapToUser(customer: BackendCustomer): User {
  return {
    id: customer.id,
    name: customer.name?.trim() || "Unnamed user",
    email: customer.email || "—",
    phone: customer.phone || "—",
    avatarColor: colorForId(customer.id),
    city: customer.emirate || "—",
    address: customer.address || "",
    bookings: customer.bookingCount ?? 0,
    lastBookingAt: customer.lastBookingAt ?? null,
    joinedAt: customer.createdAt || new Date().toISOString(),
    status: statusFor(customer.isActive),
    blockedAt: customer.blockedAt ?? null,
    blockReason: customer.blockReason ?? "",
    blockedUntil: customer.blockedUntil ?? null,
    flagged: customer.flagged ?? false,
    flagReason: customer.flagReason ?? "",
    noteCount: customer.noteCount ?? 0,
  };
}

export interface BackendCustomerDetail extends BackendCustomer {
  adminNotes?: import("@/types").UserNote[];
  moderationLog?: import("@/types").ModerationEntry[];
  bookingStats?: Record<string, number> & { total?: number };
  recentBookings?: {
    id: string;
    status: string;
    scheduledDate: string;
    providerName: string | null;
    providerCity: string | null;
    monthlySalary?: number;
  }[];
}

export function mapToUserDetail(customer: BackendCustomerDetail): import("@/types").UserDetail {
  return {
    ...mapToUser(customer),
    bookingStats: { total: 0, ...(customer.bookingStats ?? {}) } as import("@/types").UserDetail["bookingStats"],
    recentBookings: (customer.recentBookings ?? []).map((b) => ({ ...b, monthlySalary: b.monthlySalary ?? 0 })),
    adminNotes: customer.adminNotes ?? [],
    moderationLog: customer.moderationLog ?? [],
  };
}
