export type PayoutScheduleType = "weekly" | "5days" | "3days" | "2days" | "1day";

export interface PayoutScheduleOption {
  type: PayoutScheduleType;
  label: string;
  timeline: string;
  feePercent: number;
  feeCapMinor: number; // in minor units (kobo)
  feeCapDisplay: string;
  description: string;
  recommended?: boolean;
}

export interface PayoutScheduleConfig {
  type: PayoutScheduleType;
  feePercent: number;
  feeCapMinor: number;
  timelineDays: number;
  label: string;
}

export interface BrandPayoutSettings {
  schedule: PayoutScheduleType;
  updatedAt: Date;
}

export interface WalletPayoutSchedule {
  type: PayoutScheduleType;
  feePercent: number;
  feeCapMinor: number;
  timelineDays: number;
  label: string;
}

export interface PayoutFeeCalculation {
  estimatedEarnings: number; // in minor units
  feeAmount: number; // in minor units
  netAmount: number; // in minor units
  feePercent: number;
  feeCapMinor: number;
}
