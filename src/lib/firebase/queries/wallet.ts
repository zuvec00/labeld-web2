// lib/firebase/queries/wallet.ts
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  Unsubscribe,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { WalletSummary, WalletLedgerEntry, EarningsBySource } from "@/types/wallet";

// Helper to convert Firestore timestamp to number
function toMillis(v: any): number {
  if (!v) return Date.now();
  if (typeof v === "number") return v;
  if (v.toMillis) return v.toMillis();
  if (v.seconds) return v.seconds * 1000;
  return Date.now();
}

// Helper to parse wallet summary from user document
function parseWalletSummary(userData: any): WalletSummary | null {
  if (!userData?.wallet) return null;
  
  const wallet = userData.wallet;
  return {
    currency: wallet.currency || "NGN",
    eligibleBalanceMinor: wallet.eligibleBalanceMinor || 0,
    onHoldMinor: wallet.onHoldMinor || 0,
    payout: {
      frequency: wallet.payout?.frequency || "weekly",
      dayOfWeek: wallet.payout?.dayOfWeek || 5,
      cutOffDayOfWeek: wallet.payout?.cutOffDayOfWeek || 4,
      cutOffHourLocal: wallet.payout?.cutOffHourLocal || 12,
      payoutHourLocal: wallet.payout?.payoutHourLocal || 14,
      nextPayoutAt: wallet.payout?.nextPayoutAt ? toMillis(wallet.payout.nextPayoutAt) : undefined,
      lastPayoutAt: wallet.payout?.lastPayoutAt ? toMillis(wallet.payout.lastPayoutAt) : undefined,
      bank: wallet.payout?.bank ? {
        bankName: wallet.payout.bank.bankName,
        accountNumber: wallet.payout.bank.accountNumber,
        accountName: wallet.payout.bank.accountName,
        bankCode: wallet.payout.bank.bankCode || "",
        isVerified: wallet.payout.bank.isVerified || false,
      } : null,
    },
    lastUpdatedAt: toMillis(wallet.lastUpdatedAt),
  };
}

// Helper to parse ledger entry from Firestore document
function parseLedgerEntry(snap: QueryDocumentSnapshot): WalletLedgerEntry {
  const data = snap.data();
  return {
    vendorId: data.vendorId,
    currency: data.currency || "NGN",
    source: data.source,
    orderRef: data.orderRef,
    eventId: data.eventId || null,
    amountMinor: data.amountMinor || 0,
    type: data.type,
    note: data.note || undefined,
    targetPayoutAt: toMillis(data.targetPayoutAt),
    targetPayoutKey: data.targetPayoutKey || "",
    payoutBatchId: data.payoutBatchId || null,
    createdAt: toMillis(data.createdAt),
    createdBy: data.createdBy || "system",
  };
}

/**
 * Fetches wallet summary for a user
 */
export async function getWalletSummary(vendorId: string): Promise<WalletSummary | null> {
  try {
    const userRef = doc(db, "users", vendorId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    const userData = userSnap.data();
    return parseWalletSummary(userData);
  } catch (error) {
    console.error("Error fetching wallet summary:", error);
    return null;
  }
}

/**
 * Watches wallet summary for real-time updates
 */
export function watchWalletSummary(
  vendorId: string,
  callback: (summary: WalletSummary | null) => void
): Unsubscribe {
  const userRef = doc(db, "users", vendorId);
  
  return onSnapshot(userRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    
    const userData = snap.data();
    const summary = parseWalletSummary(userData);
    callback(summary);
  }, (error) => {
    console.error("Error watching wallet summary:", error);
    callback(null);
  });
}

/**
 * Fetches wallet ledger entries for a vendor
 */
export async function getWalletLedgerEntries(
  vendorId: string,
  limitCount: number = 50
): Promise<WalletLedgerEntry[]> {
  try {
    const ledgerRef = collection(db, "walletLedger");
    const q = query(
      ledgerRef,
      where("vendorId", "==", vendorId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(parseLedgerEntry);
  } catch (error) {
    console.error("Error fetching wallet ledger entries:", error);
    return [];
  }
}

/**
 * Watches wallet ledger entries for real-time updates
 */
export function watchWalletLedgerEntries(
  vendorId: string,
  callback: (entries: WalletLedgerEntry[]) => void,
  limitCount: number = 50,
  onError?: (error: Error) => void
): Unsubscribe {
  const ledgerRef = collection(db, "walletLedger");
  const q = query(
    ledgerRef,
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map(parseLedgerEntry);
    callback(entries);
  }, (error) => {
    console.error("Error watching wallet ledger entries:", error);
    if (onError) onError(error);
    callback([]);
  });
}

/**
 * Computes earnings by source from ledger entries
 */
export function computeEarningsBySource(entries: WalletLedgerEntry[]): EarningsBySource {
  const result: EarningsBySource = {
    event: { eligibleMinor: 0, onHoldMinor: 0 },
    store: { eligibleMinor: 0, onHoldMinor: 0 },
  };
  
  entries.forEach(entry => {
    if (entry.type === "credit_eligible") {
      if (entry.source === "event") {
        result.event.eligibleMinor += entry.amountMinor;
      } else if (entry.source === "store") {
        result.store.eligibleMinor += entry.amountMinor;
      }
    } else if (entry.type === "debit_hold") {
      if (entry.source === "event") {
        result.event.onHoldMinor += entry.amountMinor;
      } else if (entry.source === "store") {
        result.store.onHoldMinor += entry.amountMinor;
      }
    }
  });
  
  return result;
}

/**
 * Fetches all wallet data for a vendor (summary + ledger entries)
 */
export async function getWalletData(vendorId: string) {
  try {
    const [summary, entries] = await Promise.all([
      getWalletSummary(vendorId),
      getWalletLedgerEntries(vendorId)
    ]);
    
    const earningsBySource = computeEarningsBySource(entries);
    
    return {
      summary,
      entries,
      earningsBySource,
    };
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return {
      summary: null,
      entries: [],
      earningsBySource: {
        event: { eligibleMinor: 0, onHoldMinor: 0 },
        store: { eligibleMinor: 0, onHoldMinor: 0 },
      },
    };
  }
}

/**
 * Watches all wallet data for real-time updates
 */
export function watchWalletData(
  vendorId: string,
  callback: (data: {
    summary: WalletSummary | null;
    entries: WalletLedgerEntry[];
    earningsBySource: EarningsBySource;
  }) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let summary: WalletSummary | null = null;
  let entries: WalletLedgerEntry[] = [];
  
  const updateCallback = () => {
    const earningsBySource = computeEarningsBySource(entries);
    callback({ summary, entries, earningsBySource });
  };
  
  const unsubscribeSummary = watchWalletSummary(vendorId, (newSummary) => {
    summary = newSummary;
    updateCallback();
  });
  
  const unsubscribeEntries = watchWalletLedgerEntries(vendorId, (newEntries) => {
    entries = newEntries;
    updateCallback();
  }, (error) => {
    if (onError) onError(error);
  });
  
  return () => {
    unsubscribeSummary();
    unsubscribeEntries();
  };
}
