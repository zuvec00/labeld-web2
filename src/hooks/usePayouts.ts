// hooks/usePayouts.ts
import { useMemo } from "react";
import { WalletLedgerEntry } from "@/types/wallet";

export interface PayoutEntry {
  id: string;
  createdAt: number;
  amountMinor: number;
  status: "pending" | "processing" | "completed" | "failed";
  payoutBatchId?: string;
  targetPayoutAt?: number;
  targetPayoutKey?: string;
  reference?: string;
}

export interface UsePayoutsReturn {
  payouts: PayoutEntry[];
  totalPayouts: number;
  pendingPayouts: number;
  completedPayouts: number;
}

export function usePayouts(ledgerEntries: WalletLedgerEntry[]): UsePayoutsReturn {
  const payouts = useMemo(() => {
    // Filter for payout entries (type: "debit_payout")
    const payoutEntries = ledgerEntries.filter(entry => entry.type === "debit_payout");
    
    return payoutEntries.map(entry => {
      // If there's a debit_payout entry, it means the payout was successful
      let status: "pending" | "processing" | "completed" | "failed" = "completed";
      
      if (entry.targetPayoutAt) {
        const now = Date.now();
        const targetTime = entry.targetPayoutAt;
        
        if (now < targetTime) {
          status = "pending";
        } else {
          // If we have a debit_payout entry, it means the payout was successful
          status = "completed";
        }
      }
      
      return {
        id: entry.payoutBatchId || `${entry.createdAt}-${entry.amountMinor}`, // Use payoutBatchId or create a unique ID
        createdAt: entry.createdAt,
        amountMinor: entry.amountMinor,
        status,
        payoutBatchId: entry.payoutBatchId || undefined,
        targetPayoutAt: entry.targetPayoutAt,
        targetPayoutKey: entry.targetPayoutKey,
        reference: entry.payoutBatchId ? `TXN_${entry.payoutBatchId.slice(-8).toUpperCase()}` : undefined,
      };
    }).sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first
  }, [ledgerEntries]);

  const totalPayouts = useMemo(() => {
    return payouts.reduce((sum, payout) => sum + payout.amountMinor, 0);
  }, [payouts]);

  const pendingPayouts = useMemo(() => {
    return payouts.filter(payout => payout.status === "pending").length;
  }, [payouts]);

  const completedPayouts = useMemo(() => {
    return payouts.filter(payout => payout.status === "completed").length;
  }, [payouts]);

  return {
    payouts,
    totalPayouts,
    pendingPayouts,
    completedPayouts,
  };
}
