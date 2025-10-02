// lib/firebase/callables/bank.ts
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebaseConfig";

export interface Bank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
}

export interface BankListResponse {
  status: boolean;
  message: string;
  data: Bank[];
}

export interface VerifyAccountResponse {
  status: boolean;
  message: string;
  data: {
    account_name: string;
    account_number: string;
    bank_id: number;
  };
}


// Get bank list
export const getBankList = httpsCallable<{ isLive?: boolean }, BankListResponse>(
  functions,
  "getBankList"
);

// Verify bank account
export const verifyAccount = httpsCallable<
  { accountNumber: string; bankCode: string; isLive?: boolean },
  VerifyAccountResponse
>(functions, "verifyAccount");


// Helper function to call getBankList
export async function fetchBankList(isLive: boolean = true): Promise<Bank[]> {
  try {
    const result = await getBankList({ isLive });
    return result.data.data;
  } catch (error) {
    console.error("Error fetching bank list:", error);
    throw new Error("Failed to fetch bank list");
  }
}

// Helper function to verify account
export async function verifyBankAccount(
  accountNumber: string,
  bankCode: string,
  isLive: boolean = true
): Promise<VerifyAccountResponse> {
  try {
    const result = await verifyAccount({ accountNumber, bankCode, isLive });
    return result.data;
  } catch (error) {
    console.error("Error verifying account:", error);
    throw error;
  }
}

