import type { Subscription, User, UserDetail, UserStatus } from "@/types";
import { colorForId } from "@/lib/utils";

export interface BackendCustomer {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  emirate?: string;
  address?: string;
  isActive?: boolean;
  blockedAt?: string | null;
  blockReason?: string;
  blockedUntil?: string | null;
  currentPlan?: Subscription | null;
  createdAt?: string;
}

export interface BackendCustomerDetail extends BackendCustomer {
  subscription?: { current: Subscription | null; upcoming: Subscription | null; history: Subscription[] };
}

// The User model has no "suspended" state distinct from inactive — a
// deactivated customer account is shown as "blocked" rather than this UI
// inventing a status nothing in the backend actually writes.
function statusFor(isActive?: boolean): UserStatus {
  return isActive === false ? "inactive" : "active";
}

export function mapToUser(customer: BackendCustomer): User {
  return {
    id: customer.id,
    name: customer.name?.trim() || "Unnamed customer",
    email: customer.email || "—",
    phone: customer.phone || "—",
    avatarColor: colorForId(customer.id),
    city: customer.emirate || "—",
    address: customer.address || "",
    joinedAt: customer.createdAt || new Date().toISOString(),
    status: statusFor(customer.isActive),
    blockedAt: customer.blockedAt ?? null,
    blockReason: customer.blockReason ?? "",
    blockedUntil: customer.blockedUntil ?? null,
    currentPlan: customer.currentPlan ?? null,
  };
}

export function mapToUserDetail(customer: BackendCustomerDetail): UserDetail {
  return {
    ...mapToUser(customer),
    subscription: customer.subscription ?? { current: null, upcoming: null, history: [] },
  };
}
