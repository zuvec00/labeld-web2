import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase/firebaseConfig";

function fn() {
  return getFunctions(app);
}

export interface CustomerPayload {
  brandId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  instagramHandle?: string;
  notes?: string;
  addresses?: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }[];
}

export async function createCustomer(data: CustomerPayload): Promise<{ customerId: string }> {
  const res = await httpsCallable<CustomerPayload, { customerId: string }>(fn(), "createCustomer")(data);
  return res.data;
}

export async function updateCustomer(data: CustomerPayload & { customerId: string }): Promise<void> {
  await httpsCallable(fn(), "updateCustomer")(data);
}

export async function deleteCustomer(brandId: string, customerId: string): Promise<void> {
  await httpsCallable(fn(), "deleteCustomer")({ brandId, customerId });
}

export async function sendCustomerCampaign(data: {
  brandId: string;
  subject: string;
  message: string;
  segment?: string;
  customerIds?: string[];
  ctaText?: string;
  ctaLink?: string;
  heroImage?: string;
}): Promise<void> {
  await httpsCallable(fn(), "sendCustomerCampaign")(data);
}
