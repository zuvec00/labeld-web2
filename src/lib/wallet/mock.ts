// lib/wallet/mock.ts
import { WalletSummary, WalletLedgerEntry, WithdrawalRequest, EarningsBySource } from "@/types/wallet";

// Helper to generate random amounts in minor units (kobo)
const randomAmount = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate random dates within last 90 days
const randomDate = () => Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000;

// Helper to generate short IDs
const shortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const mockWalletSummary: WalletSummary = {
  currency: "NGN",
  eligibleBalanceMinor: 1250000, // ₦12,500
  onHoldMinor: 450000,   // ₦4,500
  payout: {
    frequency: "weekly",
    dayOfWeek: 5, // Friday
    cutOffDayOfWeek: 4, // Thursday
    cutOffHourLocal: 12, // 12:00
    payoutHourLocal: 14, // 14:00
    nextPayoutAt: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
    lastPayoutAt: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago
    bank: {
      bankName: "Access Bank",
      accountNumber: "1234567890",
      accountName: "John Doe",
      bankCode: "044",
      isVerified: true
    }
  },
  lastUpdatedAt: Date.now() - 300000, // 5 minutes ago
};

// Mock data for testing different bank account states
export const mockWalletSummaryNoBank: WalletSummary = {
  currency: "NGN",
  eligibleBalanceMinor: 1250000,
  onHoldMinor: 450000,
  payout: {
    frequency: "weekly",
    dayOfWeek: 5,
    cutOffDayOfWeek: 4,
    cutOffHourLocal: 12,
    payoutHourLocal: 14,
    nextPayoutAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    lastPayoutAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    bank: null // No bank account
  },
  lastUpdatedAt: Date.now() - 300000,
};

export const mockWalletSummaryUnverifiedBank: WalletSummary = {
  currency: "NGN",
  eligibleBalanceMinor: 1250000,
  onHoldMinor: 450000,
  payout: {
    frequency: "weekly",
    dayOfWeek: 5,
    cutOffDayOfWeek: 4,
    cutOffHourLocal: 12,
    payoutHourLocal: 14,
    nextPayoutAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    lastPayoutAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    bank: {
      bankName: "GTBank",
      accountNumber: "9876543210",
      accountName: "Jane Smith",
      bankCode: "058",
      isVerified: false // Bank account exists but not verified
    }
  },
  lastUpdatedAt: Date.now() - 300000,
};

export const mockEarningsBySource: EarningsBySource = {
  event: {
    eligibleMinor: 850000,  // ₦8,500
    onHoldMinor: 320000,   // ₦3,200
  },
  store: {
    eligibleMinor: 400000,  // ₦4,000
    onHoldMinor: 130000,   // ₦1,300
  },
};

export const mockLedgerEntries: WalletLedgerEntry[] = [
  // Recent eligible credits
  {
    vendorId: "vendor_123",
    currency: "NGN",
    source: "event",
    orderRef: { collection: "orders", id: "order_xyz789" },
    eventId: "event_abc123",
    amountMinor: 150000, // ₦1,500
    type: "credit_eligible",
    note: "Event ticket sales - Lagos Fashion Week",
    targetPayoutAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-17",
    payoutBatchId: null,
    createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    createdBy: "system",
  },
  {
    vendorId: "vendor_123",
    currency: "NGN",
    source: "store",
    orderRef: { collection: "orders", id: "order_def456" },
    eventId: null,
    amountMinor: 75000, // ₦750
    type: "credit_eligible",
    note: "Merchandise sale - Branded T-shirt",
    targetPayoutAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-17",
    payoutBatchId: null,
    createdAt: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
    createdBy: "system",
  },
  // On hold entries
  {
    vendorId: "vendor_123",
    currency: "NGN",
    source: "event",
    orderRef: { collection: "orders", id: "order_ghi789" },
    eventId: "event_def456",
    amountMinor: 200000, // ₦2,000
    type: "debit_hold",
    note: "Event ticket sales - Afrobeat Festival (on hold)",
    targetPayoutAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-17",
    payoutBatchId: null,
    createdAt: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
    createdBy: "system",
  },
  {
    vendorId: "vendor_123",
    currency: "NGN",
    source: "store",
    orderRef: { collection: "orders", id: "order_jkl012" },
    eventId: null,
    amountMinor: 50000, // ₦500
    type: "debit_hold",
    note: "Merchandise sale - Hoodie (on hold)",
    targetPayoutAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-17",
    payoutBatchId: null,
    createdAt: Date.now() - 8 * 60 * 60 * 1000, // 8 hours ago
    createdBy: "system",
  },
  // Debits (payouts)
  {
    vendorId: "vendor_123",
    currency: "NGN",
    source: "event",
    orderRef: { collection: "orders", id: "payout_001" },
    eventId: null,
    amountMinor: 500000, // ₦5,000
    type: "debit_payout",
    note: "Withdrawal to bank account",
    targetPayoutAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-10",
    payoutBatchId: "batch_001",
    createdAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    createdBy: "system",
  },
  {
    vendorId: "vendor_123",
    currency: "NGN",
    source: "store",
    orderRef: { collection: "orders", id: "payout_002" },
    eventId: null,
    amountMinor: 250000, // ₦2,500
    type: "debit_payout",
    note: "Withdrawal to bank account",
    targetPayoutAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-03",
    payoutBatchId: "batch_002",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    createdBy: "system",
  },
  // Refunds
  {
    vendorId: "vendor_123",
    currency: "NGN",
    source: "event",
    orderRef: { collection: "orders", id: "order_mno345" },
    eventId: "event_ghi789",
    amountMinor: 100000, // ₦1,000
    type: "debit_refund",
    note: "Event cancellation refund",
    targetPayoutAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-05",
    payoutBatchId: null,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    createdBy: "system",
  },
  // More entries for variety
  {
    vendorId: "vendor_123",
    currency: "NGN",
    source: "event",
    orderRef: { collection: "orders", id: "order_pqr678" },
    eventId: "event_jkl012",
    amountMinor: 300000, // ₦3,000
    type: "credit_eligible",
    note: "Event ticket sales - Tech Conference",
    targetPayoutAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-17",
    payoutBatchId: null,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    createdBy: "system",
  },
  {
    vendorId: "vendor_123",
    currency: "NGN",
    source: "store",
    orderRef: { collection: "orders", id: "order_stu901" },
    eventId: null,
    amountMinor: 80000, // ₦800
    type: "debit_hold",
    note: "Merchandise sale - Cap (on hold)",
    targetPayoutAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-17",
    payoutBatchId: null,
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    createdBy: "system",
  },
  {
    vendorId: "vendor_123",
    currency: "NGN",
    source: "event",
    orderRef: { collection: "orders", id: "order_vwx234" },
    eventId: "event_mno345",
    amountMinor: 180000, // ₦1,800
    type: "credit_eligible",
    note: "Event ticket sales - Music Festival",
    targetPayoutAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-17",
    payoutBatchId: null,
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
    createdBy: "system",
  },
  // Additional entries to reach ~30 total
  ...Array.from({ length: 20 }, (_, i) => ({
    vendorId: "vendor_123",
    currency: "NGN" as const,
    source: (["event", "store"] as const)[Math.floor(Math.random() * 2)],
    orderRef: { collection: "orders" as const, id: `order_${shortId()}` },
    eventId: Math.random() > 0.3 ? `event_${shortId()}` : null,
    amountMinor: randomAmount(25000, 300000),
    type: (["credit_eligible", "debit_hold", "debit_payout", "debit_refund"] as const)[Math.floor(Math.random() * 4)],
    note: [
      "Event ticket sales",
      "Merchandise sale",
      "Withdrawal to bank account",
      "Event cancellation refund",
      "Store order refund",
      "Bonus payment",
      "Commission earned"
    ][Math.floor(Math.random() * 7)],
    targetPayoutAt: Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000,
    targetPayoutKey: "2025-01-17",
    payoutBatchId: Math.random() > 0.7 ? `batch_${shortId()}` : null,
    createdAt: randomDate(),
    createdBy: "system" as const,
  } as WalletLedgerEntry))
];

export const mockWithdrawalRequests: WithdrawalRequest[] = [
  {
    id: "withdrawal_001",
    vendorId: "vendor_123",
    amountMinor: 500000, // ₦5,000
    status: "paid",
    reference: "TXN_ABC123456",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  },
  {
    id: "withdrawal_002",
    vendorId: "vendor_123",
    amountMinor: 250000, // ₦2,500
    status: "approved",
    reference: "TXN_DEF789012",
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
  },
  {
    id: "withdrawal_003",
    vendorId: "vendor_123",
    amountMinor: 750000, // ₦7,500
    status: "requested",
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  },
  {
    id: "withdrawal_004",
    vendorId: "vendor_123",
    amountMinor: 300000, // ₦3,000
    status: "rejected",
    reference: "TXN_GHI345678",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
  },
  {
    id: "withdrawal_005",
    vendorId: "vendor_123",
    amountMinor: 400000, // ₦4,000
    status: "cancelled",
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
  },
  {
    id: "withdrawal_006",
    vendorId: "vendor_123",
    amountMinor: 600000, // ₦6,000
    status: "paid",
    reference: "TXN_JKL901234",
    createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000, // 21 days ago
  },
  {
    id: "withdrawal_007",
    vendorId: "vendor_123",
    amountMinor: 350000, // ₦3,500
    status: "paid",
    reference: "TXN_MNO567890",
    createdAt: Date.now() - 28 * 24 * 60 * 60 * 1000, // 28 days ago
  },
  {
    id: "withdrawal_008",
    vendorId: "vendor_123",
    amountMinor: 800000, // ₦8,000
    status: "requested",
    createdAt: Date.now() - 35 * 24 * 60 * 60 * 1000, // 35 days ago
  },
];

// Utility functions for formatting
export const formatCurrency = (amountMinor: number): string => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
};

export const formatDateShort = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
};
