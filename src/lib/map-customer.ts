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
    name: customer.name || "—",
    email: customer.email || "—",
    phone: customer.phone || "—",
    avatarColor: colorForId(customer.id),
    city: customer.emirate || customer.address || "—",
    bookings: customer.bookingCount ?? 0,
    joinedAt: customer.createdAt || new Date().toISOString(),
    status: statusFor(customer.isActive),
  };
}
