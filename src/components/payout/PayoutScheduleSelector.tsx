"use client";

import { useState, useEffect } from "react";
import { PayoutScheduleType } from "@/types/payout";
import { getPayoutScheduleOptions } from "@/lib/payout/utils";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface PayoutScheduleSelectorProps {
	currentSchedule?: PayoutScheduleType;
	onScheduleChange: (schedule: PayoutScheduleType) => void;
	onSave?: (schedule: PayoutScheduleType) => void;
	isLoading?: boolean;
}

export default function PayoutScheduleSelector({
	currentSchedule,
	onScheduleChange,
	onSave,
	isLoading = false,
}: PayoutScheduleSelectorProps) {
	const [selectedSchedule, setSelectedSchedule] =
		useState<PayoutScheduleType | null>(currentSchedule || null);

	const scheduleOptions = getPayoutScheduleOptions();

	// Sync internal state with prop changes
	useEffect(() => {
		if (currentSchedule) {
			setSelectedSchedule(currentSchedule);
		}
	}, [currentSchedule]);

	const handleScheduleSelect = (schedule: PayoutScheduleType) => {
		setSelectedSchedule(schedule);
		onScheduleChange(schedule);
	};

	const handleSave = () => {
		if (selectedSchedule && onSave) {
			onSave(selectedSchedule);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h3 className="text-lg font-semibold text-text mb-2">
					Choose Your Store Earnings Schedule
				</h3>
				<p className="text-text-muted text-sm">
					Select how quickly you want to receive your store earnings. Faster
					payouts have higher fees.
				</p>
			</div>

			{/* Schedule Options */}
			<div className="space-y-3">
				{scheduleOptions.map((option) => {
					const isSelected = selectedSchedule === option.type;
					const isRecommended = option.recommended;

					return (
						<button
							key={option.type}
							onClick={() => handleScheduleSelect(option.type)}
							disabled={isLoading}
							className={`
                w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left
                ${
									isSelected
										? "border-accent bg-accent/5"
										: "border-stroke hover:border-accent/50 hover:bg-accent/2"
								}
                ${
									isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
								}
              `}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<div
											className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${
													isSelected
														? "border-accent bg-accent"
														: "border-stroke"
												}
                      `}
										>
											{isSelected && (
												<div className="w-2 h-2 rounded-full bg-white" />
											)}
										</div>
										<div>
											<div className="flex items-center gap-2">
												<h4 className="font-medium text-text">
													{option.label}
												</h4>
												{isRecommended && (
													<span className="px-2 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full">
														Recommended
													</span>
												)}
											</div>
											<p className="text-sm text-text-muted">
												{option.description}
											</p>
										</div>
									</div>
								</div>

								<div className="text-right ml-4">
									<div className="text-sm font-medium text-text">
										{option.timeline}
									</div>
									<div className="text-sm text-text-muted">
										{option.feePercent > 0
											? `${option.feePercent}% fee`
											: "No fee"}
									</div>
									<div className="text-xs text-text-muted">
										{option.feeCapDisplay}
									</div>
								</div>
							</div>
						</button>
					);
				})}
			</div>

			{/* Save Button */}
			{onSave && (
				<div className="flex justify-end pt-4">
					<Button
						text={isLoading ? "Saving..." : "Save Schedule"}
						variant="primary"
						onClick={handleSave}
						disabled={!selectedSchedule || isLoading}
						className="px-6"
					>
						{isLoading && <Spinner size="sm" className="mr-2" />}
					</Button>
				</div>
			)}
		</div>
	);
}
