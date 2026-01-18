"use client";

import { useState, useEffect, useMemo } from "react";
import { getAuth } from "firebase/auth";
import {
	getFirestore,
	doc,
	getDoc,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { PayoutScheduleType } from "@/types/payout";
import { Spinner } from "@/components/ui/spinner";
import { useWallet } from "@/hooks/useWallet";
import { Calendar, CheckCircle2 } from "lucide-react";
import { formatWithCommasDouble } from "@/lib/format";

export default function PayoutSettings() {
	const { walletData } = useWallet();
	const [currentSchedule, setCurrentSchedule] =
		useState<PayoutScheduleType>("weekly");
	const [selectedSchedule, setSelectedSchedule] =
		useState<PayoutScheduleType>("weekly");
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// Get estimated earnings from wallet data
	const estimatedEarnings = walletData?.summary?.eligibleBalanceMinor || 0;

	useEffect(() => {
		loadCurrentSettings();
	}, []);

	const loadCurrentSettings = async () => {
		try {
			const auth = getAuth();
			const user = auth.currentUser;

			if (!user) {
				setError("Not authenticated");
				return;
			}

			const db = getFirestore();
			const brandDoc = await getDoc(doc(db, "brands", user.uid));

			if (brandDoc.exists()) {
				const data = brandDoc.data();
				if (data.payoutSettings?.schedule) {
					setCurrentSchedule(data.payoutSettings.schedule);
					setSelectedSchedule(data.payoutSettings.schedule);
				}
			}
		} catch (err) {
			console.error("Error loading payout settings:", err);
			setError("Failed to load current settings");
		} finally {
			setIsLoading(false);
		}
	};

	const handleScheduleChange = async () => {
		setIsSaving(true);
		setError(null);
		setSuccess(false);

		try {
			const auth = getAuth();
			const user = auth.currentUser;

			if (!user) {
				throw new Error("Not authenticated");
			}

			const db = getFirestore();
			const brandRef = doc(db, "brands", user.uid);

			// Update brand payout settings
			await updateDoc(brandRef, {
				payoutSettings: {
					schedule: selectedSchedule,
					updatedAt: serverTimestamp(),
				},
			});

			// Update wallet payout schedule
			const walletRef = doc(db, "users", user.uid);
			await updateDoc(walletRef, {
				"wallet.payout.schedule": {
					type: selectedSchedule,
					feePercent: getFeePercent(selectedSchedule),
					feeCapMinor: getFeeCap(selectedSchedule),
					timelineDays: getTimelineDays(selectedSchedule),
					label: getLabel(selectedSchedule),
				},
				"wallet.payout.updatedAt": serverTimestamp(),
			});

			setCurrentSchedule(selectedSchedule);
			setSuccess(true);

			// Clear success message after 3 seconds
			setTimeout(() => {
				setSuccess(false);
			}, 3000);
		} catch (err) {
			console.error("Error updating payout settings:", err);
			setError("Failed to save settings. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	// --- Helper Configs ---
	const getFeePercent = (schedule: PayoutScheduleType): number => {
		const configs = {
			weekly: 0,
			"5days": 1,
			"3days": 2.5,
			"2days": 4,
			"1day": 8,
		};
		return configs[schedule];
	};

	const getFeeCap = (schedule: PayoutScheduleType): number => {
		const configs = {
			weekly: 0,
			"5days": 250000,
			"3days": 400000,
			"2days": 500000,
			"1day": 500000,
		};
		return configs[schedule];
	};

	const getTimelineDays = (schedule: PayoutScheduleType): number => {
		const configs = {
			weekly: 7,
			"5days": 5,
			"3days": 3,
			"2days": 2,
			"1day": 1,
		};
		return configs[schedule];
	};

	const getLabel = (schedule: PayoutScheduleType): string => {
		const configs = {
			weekly: "Weekly",
			"5days": "5 Days",
			"3days": "3 Days",
			"2days": "2 Days",
			"1day": "1 Day",
		};
		return configs[schedule];
	};

	// --- Derived Calculations ---
	const feePercent = getFeePercent(selectedSchedule);
	const feeCap = getFeeCap(selectedSchedule);

	const estimatedFee = useMemo(() => {
		if (feePercent === 0) return 0;
		const calculated = (estimatedEarnings * feePercent) / 100;
		return Math.min(calculated, feeCap);
	}, [estimatedEarnings, feePercent, feeCap]);

	const finalPayout = estimatedEarnings - estimatedFee;
	const isDirty = selectedSchedule !== currentSchedule;

	if (isLoading) {
		return (
			<div className="h-[400px] flex items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="max-w-5xl mx-auto space-y-12 pb-20">
			{/* Header */}
			<div className="space-y-1">
				<h1 className="text-2xl md:text-3xl font-heading font-medium text-white tracking-tight">
					When do you want to receive your earnings?
				</h1>
				<p className="text-text-muted text-lg font-light">
					Choose how quickly your store payouts are processed.
				</p>
			</div>

			{/* Store Earnings Schedule */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-white font-medium text-lg">
						Store Earnings Schedule
					</h2>
					{/* Current Selection Pill */}
					<div className="px-3 py-1 rounded-full bg-surface-neutral border border-stroke flex items-center gap-2">
						<div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
						<span className="text-xs text-text-muted font-medium uppercase tracking-wide">
							Current: {getLabel(currentSchedule)} ·{" "}
							{getTimelineDays(currentSchedule)} Business Days
						</span>
					</div>
				</div>

				{/* Cards Grid */}
				<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
					{(
						[
							"weekly",
							"5days",
							"3days",
							"2days",
							"1day",
						] as PayoutScheduleType[]
					).map((schedule) => {
						const isSelected = selectedSchedule === schedule;
						const fee = getFeePercent(schedule);
						const cap = getFeeCap(schedule);

						return (
							<button
								key={schedule}
								onClick={() => setSelectedSchedule(schedule)}
								className={`
                  relative flex flex-col justify-between p-4 rounded-xl min-h-[140px] text-left transition-all duration-300
                  ${
										isSelected
											? "bg-surface border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)] scale-[1.02] z-10"
											: "bg-surface-neutral/50 border-stroke/50 hover:bg-surface hover:border-stroke hover:scale-[1.01]"
									}
                  border
                `}
							>
								{/* Selection Indicator */}
								{isSelected && (
									<div className="absolute top-3 right-3 text-green-500">
										<CheckCircle2 className="w-4 h-4" />
									</div>
								)}

								<div className="space-y-1">
									<div
										className={`text-xl font-bold tracking-tight ${
											isSelected ? "text-green-400" : "text-text"
										}`}
									>
										{getLabel(schedule)}
									</div>
									<div className="text-xs text-text-muted font-medium">
										{schedule === "weekly"
											? "Standard Speed"
											: schedule === "1day"
											? "Fastest Option"
											: "Expedited"}
									</div>
								</div>

								<div className="space-y-0.5 pt-4 border-t border-white/5 mt-4">
									<div className="flex items-baseline justify-between">
										<span className="text-xs text-text-muted">Fee</span>
										<span
											className={`text-sm font-semibold ${
												isSelected ? "text-white" : "text-text-muted"
											}`}
										>
											{fee === 0 ? "Free" : `${fee}%`}
										</span>
									</div>
									{fee > 0 && (
										<div className="flex items-baseline justify-between">
											<span className="text-[10px] text-text-muted/50 uppercase">
												Max Cap
											</span>
											<span className="text-[10px] text-text-muted/70">
												₦{formatWithCommasDouble(cap / 100)}
											</span>
										</div>
									)}
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* Inline Breakdown & Event Earnings */}
			<div className="grid md:grid-cols-2 gap-8 items-start">
				{/* Dynamic Fee Breakdown */}
				<div className="space-y-2">
					<div className="text-sm text-text-muted">
						Estimated payout (based on current balance)
					</div>
					<div className="flex items-center gap-3 text-lg font-mono">
						<span className="text-text-muted">
							₦{formatWithCommasDouble(estimatedEarnings / 100)}
						</span>
						<span className="text-text-muted/50">-</span>
						<span className="text-red-400/80">
							₦{formatWithCommasDouble(estimatedFee / 100)} fee
						</span>
						<span className="text-text-muted/50">→</span>
						<span className="text-green-400 font-bold border-b border-green-500/30 pb-0.5">
							₦{formatWithCommasDouble(finalPayout / 100)}
						</span>
					</div>
					{selectedSchedule !== "weekly" && (
						<p className="text-xs text-text-muted/50 max-w-sm leading-relaxed">
							* Fees are capped at ₦{formatWithCommasDouble(feeCap / 100)} per
							payout. You will never be charged more than this amount regardless
							of withdrawal size.
						</p>
					)}
				</div>

				{/* Event Earnings (De-emphasized) */}
				<div className="flex items-start gap-4 p-4 rounded-xl border border-dashed border-stroke/50 bg-surface-neutral/20">
					<div className="mt-1 p-2 rounded-lg bg-surface text-text-muted">
						<Calendar className="w-4 h-4" />
					</div>
					<div>
						<h3 className="text-sm font-medium text-text-muted mb-1">
							Event Earnings
						</h3>
						<p className="text-sm text-text-muted/70 leading-relaxed">
							Event earnings are paid weekly every Friday at 2PM. No fees apply
							to event payouts. This schedule cannot be changed to ensure smooth
							event settlements.
						</p>
					</div>
				</div>
			</div>

			{/* Save Action */}
			<div className="fixed bottom-8 right-8 z-50">
				{isDirty && (
					<button
						onClick={handleScheduleChange}
						disabled={isSaving}
						className={`
              flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105
              bg-white text-black font-bold text-lg
              hover:bg-green-400 hover:text-black hover:shadow-[0_0_30px_rgba(74,222,128,0.4)]
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
					>
						{isSaving ? (
							<>
								<Spinner className="w-5 h-5 border-black/30 border-t-black" />
								<span>Saving...</span>
							</>
						) : (
							<span>Save Schedule</span>
						)}
					</button>
				)}
			</div>

			{/* Success Toast / Notification */}
			{success && (
				<div className="fixed bottom-24 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
					<div className="bg-green-500 text-black px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2">
						<CheckCircle2 className="w-5 h-5" />
						Settings Saved
					</div>
				</div>
			)}
		</div>
	);
}
