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

/**
 * Computes the next weekly payout date (Friday 00:00 UTC).
 * If today is Friday before cut-off, it might be next week? 
 * Logic from prompt: "Defaults to now, finding next Friday"
 * Implementation: Find next Friday 00:00:00 UTC.
 */
export function computeNextWeeklyPayoutUtcMillis(): number {
  const now = new Date();
  
  // Create a date for "Today" but in UTC to avoid timezone drift issues for calculation
  // Or just use native UTC methods.
  const d = new Date(now);
  
  // Set to next Friday. 
  // Day of week: 0 (Sun) ... 5 (Fri) ... 6 (Sat)
  const currentDay = d.getUTCDay();
  const daysUntilFriday = (5 + 7 - currentDay) % 7; 
  
  // If today is Friday (daysUntilFriday == 0), do we mean TODAY or NEXT week?
  // Usually "Upcoming" implies the future or today if not passed.
  // Let's assume if it's already Friday, we look for the *next* payout cycle? 
  // Or if it's Friday morning, is it today?
  // Standard logic: Payouts happen on Fridays. Process runs.
  // If we are checking "Upcoming", we likely mean the next scheduled one.
  // If today is Friday, let's assume we want NEXT Friday if we missed the window, 
  // OR today if we are before. 
  // For simplicity based on prompt "Defaults to now, finding next Friday", let's advance at least 1 day if it's Friday?
  // Actually, usually these systems pick the *coming* Friday. 
  // Let's just create a date for "Next Friday".
  
  let targetDate = new Date(d);
  if (daysUntilFriday === 0) {
     // It is Friday. Move to next week?
     targetDate.setUTCDate(targetDate.getUTCDate() + 7);
  } else {
     targetDate.setUTCDate(targetDate.getUTCDate() + daysUntilFriday);
  }
  
  // Normalize to 00:00 UTC
  targetDate.setUTCHours(0, 0, 0, 0);
  
  return targetDate.getTime();
}


export function minorToDisplay(amountMinor: number, currency: string = "NGN"): string {
    // Simple formatter. Can assume NGN for now as per prompt or use Intl.
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency
    }).format(amountMinor / 100);
}
