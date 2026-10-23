import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";

export interface CustomerAddress {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Customer {
  id: string;
  brandId: string;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  instagramHandle: string | null;
  source: "manual" | "online";
  addresses: CustomerAddress[];
  totalOrders: number;
  totalSpendMinor: number;
  lastOrderAt: Date | null;
  lastOrderId: string | null;
  firstOrderAt: Date | null;
  firstOrderId: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CustomerGroup {
  id: string;
  name: string;
  customerIds: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  return null;
}

function docToCustomer(id: string, data: Record<string, unknown>): Customer {
  return {
    id,
    brandId: (data.brandId as string) ?? "",
    name: (data.name as string) ?? "",
    phoneNumber: (data.phoneNumber as string) ?? null,
    email: (data.email as string) ?? null,
    instagramHandle: (data.instagramHandle as string) ?? null,
    source: (data.source as "manual" | "online") ?? "manual",
    addresses: (data.addresses as CustomerAddress[]) ?? [],
    totalOrders: Number(data.totalOrders ?? 0),
    totalSpendMinor: Number(data.totalSpendMinor ?? 0),
    lastOrderAt: toDate(data.lastOrderAt),
    lastOrderId: (data.lastOrderId as string) ?? null,
    firstOrderAt: toDate(data.firstOrderAt),
    firstOrderId: (data.firstOrderId as string) ?? null,
    notes: (data.notes as string) ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function docToGroup(id: string, data: Record<string, unknown>): CustomerGroup {
  return {
    id,
    name: (data.name as string) ?? "",
    customerIds: (data.customerIds as string[]) ?? [],
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function subscribeBrandCustomers(
  brandId: string,
  onUpdate: (customers: Customer[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(
    collection(db, "brands", brandId, "customers"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map((d) => docToCustomer(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => onError?.(err)
  );
}

export function subscribeCustomerGroups(
  brandId: string,
  onUpdate: (groups: CustomerGroup[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(
    collection(db, "brands", brandId, "custom_segments"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map((d) => docToGroup(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => onError?.(err)
  );
}

export async function getCustomer(brandId: string, customerId: string): Promise<Customer | null> {
  const snap = await getDoc(doc(db, "brands", brandId, "customers", customerId));
  if (!snap.exists()) return null;
  return docToCustomer(snap.id, snap.data() as Record<string, unknown>);
}

export async function createCustomerGroup(
  brandId: string,
  name: string,
  customerIds: string[]
): Promise<void> {
  const ref = doc(collection(db, "brands", brandId, "custom_segments"));
  await setDoc(ref, {
    name,
    customerIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomerGroup(brandId: string, groupId: string): Promise<void> {
  await deleteDoc(doc(db, "brands", brandId, "custom_segments", groupId));
}

export interface CustomerOrderSummary {
  id: string;
  status: string;
  totalMinor: number;
  itemCount: number;
  createdAt: Date | null;
}

const digitsOnly = (v: unknown) => String(v ?? "").replace(/\D/g, "");

/**
 * A customer's purchase history. Orders carry no reliable customer index, so
 * (like the mobile profile) we match by customerId first, then deliverTo
 * email or phone, over the brand's most recent orders.
 */
export async function getCustomerOrders(
  brandId: string,
  customer: Pick<Customer, "id" | "email" | "phoneNumber">
): Promise<CustomerOrderSummary[]> {
  const snap = await getDocs(
    query(
      collection(db, "storeOrders"),
      where("brandId", "==", brandId),
      orderBy("createdAt", "desc"),
      limit(500)
    )
  );

  const email = customer.email?.trim().toLowerCase() || null;
  const phone = digitsOnly(customer.phoneNumber) || null;

  return snap.docs
    .map((d) => ({ id: d.id, data: d.data() as Record<string, any> }))
    .filter(({ data }) => {
      // Unpaid storefront checkouts are not real orders
      if (
        data.status === "pending" &&
        data.saleType !== "manual_sale" &&
        !!data.checkout &&
        !data.paidAt
      ) {
        return false;
      }
      if (data.customerId === customer.id) return true;
      const to = data.deliverTo ?? {};
      if (email && String(to.email ?? "").trim().toLowerCase() === email) return true;
      const orderPhone = digitsOnly(to.phoneNumber ?? to.phone);
      return !!phone && orderPhone === phone;
    })
    .map(({ id, data }) => ({
      id,
      status: String(data.status ?? "pending"),
      totalMinor: Number(data.amount?.totalMinor ?? 0),
      itemCount: Array.isArray(data.lineItems)
        ? data.lineItems.reduce((n: number, li: any) => n + Number(li?.qty ?? 1), 0)
        : 0,
      createdAt: toDate(data.createdAt),
    }));
}

export async function getAllCustomers(brandId: string): Promise<Customer[]> {
  const snap = await getDocs(collection(db, "brands", brandId, "customers"));
  return snap.docs.map((d) => docToCustomer(d.id, d.data() as Record<string, unknown>));
}
