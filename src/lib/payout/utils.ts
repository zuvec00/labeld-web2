import { PayoutScheduleType, PayoutScheduleConfig, PayoutFeeCalculation } from "@/types/payout";

export const PAYOUT_SCHEDULE_CONFIGS: Record<PayoutScheduleType, PayoutScheduleConfig> = {
  weekly: {
    type: "weekly",
    feePercent: 0,
    feeCapMinor: 0,
    timelineDays: 7,
    label: "Standard"
  },
  "5days": {
    type: "5days",
    feePercent: 1,
    feeCapMinor: 250000, // ₦2,500 in kobo
    timelineDays: 5,
    label: "Early"
  },
  "3days": {
    type: "3days",
    feePercent: 2.5,
    feeCapMinor: 400000, // ₦4,000 in kobo
    timelineDays: 3,
    label: "Priority"
  },
  "2days": {
    type: "2days",
    feePercent: 4,
    feeCapMinor: 500000, // ₦5,000 in kobo
    timelineDays: 2,
    label: "Fast"
  },
  "1day": {
    type: "1day",
    feePercent: 8,
    feeCapMinor: 500000, // ₦5,000 in kobo
    timelineDays: 1,
    label: "Instant"
  }
};

export function getPayoutScheduleConfig(schedule: PayoutScheduleType): PayoutScheduleConfig {
  return PAYOUT_SCHEDULE_CONFIGS[schedule];
}

export function calculatePayoutFee(earningsMinor: number, schedule: PayoutScheduleType): PayoutFeeCalculation {
  const config = getPayoutScheduleConfig(schedule);
  
  // Calculate percentage fee
  const percentageFee = Math.round((earningsMinor * config.feePercent) / 100);
  
  // Apply fee cap if it exists
  const feeAmount = config.feeCapMinor > 0 
    ? Math.min(percentageFee, config.feeCapMinor)
    : percentageFee;
  
  const netAmount = earningsMinor - feeAmount;
  
  return {
    estimatedEarnings: earningsMinor,
    feeAmount,
    netAmount,
    feePercent: config.feePercent,
    feeCapMinor: config.feeCapMinor
  };
}

export function formatCurrency(amountMinor: number): string {
  return `₦${(amountMinor / 100).toLocaleString()}`;
}

export function getPayoutScheduleOptions() {
  return [
    {
      type: "weekly" as PayoutScheduleType,
      label: "Standard",
      timeline: "7 business days",
      feePercent: 0,
      feeCapMinor: 0,
      feeCapDisplay: "Free",
      description: "Weekly store earnings at no extra cost"
    },
    {
      type: "5days" as PayoutScheduleType,
      label: "Early",
      timeline: "5 business days",
      feePercent: 1,
      feeCapMinor: 250000,
      feeCapDisplay: "₦2,500 max",
      description: "Get store earnings 2 business days earlier with 1% fee"
    },
    {
      type: "3days" as PayoutScheduleType,
      label: "Priority",
      timeline: "3 business days",
      feePercent: 2.5,
      feeCapMinor: 400000,
      feeCapDisplay: "₦4,000 max",
      description: "Fast processing for urgent store cash flow",
      recommended: true
    },
    {
      type: "2days" as PayoutScheduleType,
      label: "Fast",
      timeline: "2 business days",
      feePercent: 4,
      feeCapMinor: 500000,
      feeCapDisplay: "₦5,000 max",
      description: "Near-instant store earnings for high-volume sellers"
    },
    {
      type: "1day" as PayoutScheduleType,
      label: "Instant",
      timeline: "Next business day",
      feePercent: 8,
      feeCapMinor: 500000,
      feeCapDisplay: "₦5,000 max",
      description: "Premium option for immediate access to store funds"
    }
  ];
}
