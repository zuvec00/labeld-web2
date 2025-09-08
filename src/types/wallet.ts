// types/wallet.ts
export type Currency = "NGN";

export type LedgerType =
  | "credit_eligible"
  | "debit_payout"
  | "debit_refund"
  | "credit_release"
  | "debit_hold";

export type LedgerSource = "event" | "store";

export interface WalletSummary {
  currency: Currency;
  // We are not using "pending" for now; everything credits eligible directly:
  eligibleBalanceMinor: number;
  onHoldMinor: number;
  payout: {
    frequency: "weekly";
    dayOfWeek: 0|1|2|3|4|5|6; // 5 = Friday
    cutOffDayOfWeek: 0|1|2|3|4|5|6; // 4 = Thursday
    cutOffHourLocal: number; // 12
    payoutHourLocal: number; // 14
    nextPayoutAt?: number; // millis UTC
    lastPayoutAt?: number; // millis UTC
     bank?: {
      bankName: string;           
      accountNumber: string;      
      accountName: string;        
      bankCode: string;           
      isVerified: boolean;        
    } | null;
  };
  lastUpdatedAt: number; // millis
}

export interface WalletLedgerEntry {
  vendorId: string;
  currency: Currency;
  source: LedgerSource; // "event" for these flows
  orderRef: { collection: "orders"; id: string };
  eventId?: string | null;
  amountMinor: number; // positive int
  type: LedgerType; // here: "credit_eligible" at payment
  note?: string;

  // Weekly payout targeting (computed at credit time):
  targetPayoutAt: number; // millis UTC for the Friday 14:00 local of the target week
  targetPayoutKey: string; // e.g. "2025-09-12" (the Friday date, local)
  payoutBatchId?: string | null; // filled when actually paid out

  createdAt: number; // millis
  createdBy: "system";
}

// For display purposes, we'll compute these from the ledger entries
export interface EarningsBySource {
  event: {
    eligibleMinor: number;
    onHoldMinor: number;
  };
  store: {
    eligibleMinor: number;
    onHoldMinor: number;
  };
}

// Legacy types for backward compatibility with UI
export type WithdrawalStatus = "requested" | "approved" | "paid" | "rejected" | "cancelled";

export interface WithdrawalRequest {
  id: string;
  vendorId: string;
  amountMinor: number;
  status: WithdrawalStatus;
  reference?: string;
  createdAt: number;
}
