"use client";

import { PayoutScheduleType } from "@/types/payout";
import {
	calculatePayoutFee,
	formatCurrency,
	getPayoutScheduleConfig,
} from "@/lib/payout/utils";

interface PayoutFeeCalculatorProps {
	selectedSchedule: PayoutScheduleType;
	estimatedEarnings: number; // in minor units
}

export default function PayoutFeeCalculator({
	selectedSchedule,
	estimatedEarnings,
}: PayoutFeeCalculatorProps) {
	const scheduleConfig = getPayoutScheduleConfig(selectedSchedule);
	const feeCalculation = calculatePayoutFee(
		estimatedEarnings,
		selectedSchedule
	);

	if (estimatedEarnings === 0) {
		return (
			<div className="bg-cta/5 rounded-2xl p-6">
				<h3 className="text-lg font-semibold text-text mb-2">
					Store Earnings Fee Calculator
				</h3>
				<p className="text-text-muted text-sm">
					Start earning from your store to see payout calculations
				</p>
			</div>
		);
	}

	return (
		<div className="bg-cta/5 rounded-2xl p-6">
			<h3 className="text-lg font-semibold text-text mb-4">
				Store Earnings Fee Calculator
			</h3>

			<div className="space-y-3">
				{/* Estimated Store Earnings */}
				<div className="flex justify-between items-center py-2">
					<span className="text-text-muted">Estimated Store Earnings:</span>
					<span className="font-medium text-text">
						{formatCurrency(estimatedEarnings)}
					</span>
				</div>

				{/* Payout Fee */}
				<div className="flex justify-between items-center py-2">
					<span className="text-text-muted">
						Payout Fee ({scheduleConfig.feePercent}%):
					</span>
					<span className="font-medium text-alert">
						-{formatCurrency(feeCalculation.feeAmount)}
					</span>
				</div>

				{/* Divider */}
				<div className="border-t border-stroke my-3" />

				{/* Net Payout */}
				<div className="flex justify-between items-center py-2">
					<span className="font-semibold text-text">Net Payout:</span>
					<span className="font-bold text-lg text-accent">
						{formatCurrency(feeCalculation.netAmount)}
					</span>
				</div>

				{/* Fee Cap Info */}
				{scheduleConfig.feeCapMinor > 0 && (
					<div className="mt-3 p-3 bg-accent/5 rounded-lg">
						<p className="text-xs text-text-muted">
							Fee is capped at {formatCurrency(scheduleConfig.feeCapMinor)}{" "}
							maximum
						</p>
					</div>
				)}

				{/* Timeline Info */}
				<div className="mt-3 p-3 bg-surface rounded-lg">
					<p className="text-xs text-text-muted">
						<strong>{scheduleConfig.label} Schedule:</strong> Funds will be
						available in {scheduleConfig.timelineDays} business day
						{scheduleConfig.timelineDays !== 1 ? "s" : ""} (Monday-Friday)
					</p>
				</div>
			</div>
		</div>
	);
}
