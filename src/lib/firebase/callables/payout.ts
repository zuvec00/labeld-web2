// lib/firebase/callables/payout.ts
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebaseConfig";

export interface PayoutTestResult {
  success: boolean;
  message: string;
  results: {
    totalVendors: number;
    successful: number;
    failed: number;
    skipped: number;
    totalAmount: number;
    batchId?: string;
    dryRun: boolean;
  };
  details?: {
    vendorsWithBank: Array<{
      vendorId: string;
      vendorName: string;
      amount: string;
      hasBankDetails: boolean;
    }>;
    vendorsWithoutBank: Array<{
      vendorId: string;
      vendorName: string;
      amount: string;
      hasBankDetails: boolean;
    }>;
    payoutResults: Array<{
      vendorId: string;
      vendorName: string;
      success: boolean;
      amount: string;
      transferCode?: string;
      error?: string;
    }>;
  };
  error?: string;
}

export interface PayoutReminderResult {
  success: boolean;
  message: string;
  results: {
    totalVendors: number;
    emailsSent: number;
    emailsFailed: number;
    dryRun: boolean;
  };
  error?: string;
}

export interface PayoutRetryResult {
  success: boolean;
  message: string;
  results: {
    totalRetries: number;
    successful: number;
    failed: number;
    dryRun: boolean;
  };
  details?: {
    retryVendors: Array<{
      vendorId: string;
      vendorName: string;
      amount: string;
    }>;
    retryResults: Array<{
      vendorId: string;
      vendorName: string;
      success: boolean;
      amount: string;
      transferCode?: string;
      error?: string;
    }>;
  };
  error?: string;
}

export interface StorePayoutTestResult {
  success: boolean;
  message: string;
  results: {
    totalVendors: number;
    successful: number;
    failed: number;
    skipped: number;
    totalAmount: number;
    batchId?: string;
    dryRun: boolean;
  };
  details?: {
    vendorsWithBank: Array<{
      vendorId: string;
      vendorName: string;
      amount: string;
      hasBankDetails: boolean;
    }>;
    vendorsWithoutBank: Array<{
      vendorId: string;
      vendorName: string;
      amount: string;
      hasBankDetails: boolean;
    }>;
    payoutResults: Array<{
      vendorId: string;
      vendorName: string;
      success: boolean;
      amount: string;
      transferCode?: string;
      error?: string;
    }>;
  };
  error?: string;
}

// Test payout processor
export const testPayoutProcessor = httpsCallable<
  { testMode?: boolean; dryRun?: boolean },
  PayoutTestResult
>(functions, "testPayoutProcessor");

// Test payout reminders
export const testPayoutReminders = httpsCallable<
  { dryRun?: boolean },
  PayoutReminderResult
>(functions, "testPayoutReminders");

// Test retry failed payouts
export const testRetryFailedPayouts = httpsCallable<
  { dryRun?: boolean },
  PayoutRetryResult
>(functions, "testRetryFailedPayouts");

// Test store payout processor
export const testStorePayoutProcessor = httpsCallable<
  { testMode?: boolean; dryRun?: boolean },
  StorePayoutTestResult
>(functions, "testStorePayoutProcessor");

// Helper functions
export async function runTestPayout(
  testMode: boolean = true,
  dryRun: boolean = false
): Promise<PayoutTestResult> {
  try {
    const result = await testPayoutProcessor({ testMode, dryRun });
    return result.data;
  } catch (error) {
    console.error("Error running test payout:", error);
    throw error;
  }
}

export async function runTestPayoutReminders(
  dryRun: boolean = false
): Promise<PayoutReminderResult> {
  try {
    const result = await testPayoutReminders({ dryRun });
    return result.data;
  } catch (error) {
    console.error("Error running test payout reminders:", error);
    throw error;
  }
}

export async function runTestRetryFailedPayouts(
  dryRun: boolean = false
): Promise<PayoutRetryResult> {
  try {
    const result = await testRetryFailedPayouts({ dryRun });
    return result.data;
  } catch (error) {
    console.error("Error running test retry failed payouts:", error);
    throw error;
  }
}

export async function runTestStorePayout(
  testMode: boolean = true,
  dryRun: boolean = false
): Promise<StorePayoutTestResult> {
  try {
    const result = await testStorePayoutProcessor({ testMode, dryRun });
    console.log("Test store payout result:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error running test store payout:", error);
    throw error;
  }
}
