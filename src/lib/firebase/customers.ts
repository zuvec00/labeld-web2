"use client";

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebaseConfig";

export interface CustomerAddress {
  address: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
}

export interface Customer {
  id: string;
  brandId: string;
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  instagramHandle?: string | null;
  source: "online" | "manual";
  addresses: CustomerAddress[];
  totalOrders: number;
  totalSpendMinor: number;
  lastOrderAt?: { _seconds: number; _nanoseconds: number } | string | null;
  notes?: string | null;
}

/** Normalised customer details attached to a manual sale. */
export interface CustomerDetails {
  customerId?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  totalOrders?: number;
  totalSpendMinor?: number;
  lastOrderAt?: Date | null;
}

export function customerFullName(d: CustomerDetails): string {
  return [d.firstName, d.lastName].filter(Boolean).join(" ");
}

function lastOrderToDate(
  v: Customer["lastOrderAt"]
): Date | null {
  if (!v) return null;
  if (typeof v === "string") return new Date(v);
  if (typeof v === "object" && "_seconds" in v) {
    return new Date(v._seconds * 1000);
  }
  return null;
}

export function customerToDetails(c: Customer): CustomerDetails {
  const parts = c.name.trim().split(" ").filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
  const primary = c.addresses?.[0];
  return {
    customerId: c.id,
    firstName,
    lastName,
    email: c.email ?? undefined,
    phone: c.phoneNumber ?? undefined,
    address: primary?.address ?? undefined,
    city: primary?.city ?? undefined,
    state: primary?.state ?? undefined,
    country: primary?.country ?? undefined,
    postalCode: primary?.postalCode ?? undefined,
    totalOrders: c.totalOrders,
    totalSpendMinor: c.totalSpendMinor,
    lastOrderAt: lastOrderToDate(c.lastOrderAt),
  };
}

export async function listCustomers(brandId: string): Promise<Customer[]> {
  const fn = getFunctions(app);
  const callable = httpsCallable(fn, "listCustomers");
  const { data } = await callable({
    brandId,
    limit: 100,
    orderBy: "totalSpendMinor",
    direction: "desc",
  });
  const res = data as { success: boolean; customers: Customer[] };
  return res.customers ?? [];
}

export interface SaveCustomerArgs {
  brandId: string;
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  addresses?: CustomerAddress[];
}

export async function createCustomer(
  args: SaveCustomerArgs
): Promise<{ customerId: string }> {
  const fn = getFunctions(app);
  const callable = httpsCallable(fn, "createCustomer");
  const { data } = await callable({ ...args, source: "manual" });
  const res = data as { success: boolean; customerId: string };
  if (!res.success || !res.customerId) {
    throw new Error("Failed to create customer");
  }
  return { customerId: res.customerId };
}

export async function updateCustomer(
  args: SaveCustomerArgs & { customerId: string }
): Promise<void> {
  const fn = getFunctions(app);
  const callable = httpsCallable(fn, "updateCustomer");
  const { data } = await callable(args);
  const res = data as { success: boolean };
  if (!res.success) throw new Error("Failed to update customer");
}
