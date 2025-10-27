"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import {
	getFirestore,
	doc,
	getDoc,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { PayoutScheduleType } from "@/types/payout";
import PayoutScheduleSelector from "@/components/payout/PayoutScheduleSelector";
import PayoutFeeCalculator from "@/components/payout/PayoutFeeCalculator";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useWallet } from "@/hooks/useWallet";

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

	// Debug: Log when selectedSchedule changes
	useEffect(() => {
		console.log(
			"PayoutSettings - selectedSchedule changed to:",
			selectedSchedule
		);
	}, [selectedSchedule]);

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

	const handleScheduleSelect = (schedule: PayoutScheduleType) => {
		console.log("PayoutSettings - handleScheduleSelect called with:", schedule);
		setSelectedSchedule(schedule);
	};

	const handleScheduleChange = async (schedule: PayoutScheduleType) => {
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
					schedule,
					updatedAt: serverTimestamp(),
				},
			});

			// Update wallet payout schedule
			const walletRef = doc(db, "users", user.uid);
			await updateDoc(walletRef, {
				"wallet.payout.schedule": {
					type: schedule,
					feePercent: getFeePercent(schedule),
					feeCapMinor: getFeeCap(schedule),
					timelineDays: getTimelineDays(schedule),
					label: getLabel(schedule),
				},
				"wallet.payout.updatedAt": serverTimestamp(),
			});

			setCurrentSchedule(schedule);
			setSuccess(true);

			// Clear success message after 3 seconds
			setTimeout(() => setSuccess(false), 3000);
		} catch (err) {
			console.error("Error updating payout settings:", err);
			setError("Failed to save settings. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	// Helper functions for schedule configuration
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
			weekly: "Standard",
			"5days": "Early",
			"3days": "Priority",
			"2days": "Fast",
			"1day": "Instant",
		};
		return configs[schedule];
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse">
					<div className="h-8 bg-stroke rounded mb-4"></div>
					<div className="space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="h-20 bg-stroke rounded-2xl"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-heading font-semibold text-text mb-2">
					Earnings Payout Settings
				</h2>
				<p className="text-text-muted">
					Configure how quickly you receive your earnings from sales.
				</p>
			</div>

			{/* Event Schedule Info */}
			<div className="bg-accent/10 border border-accent/20 rounded-2xl p-6">
				<h3 className="text-lg font-semibold text-text mb-2">
					Event Earnings Schedule
				</h3>
				<div className="flex items-center gap-3">
					<div className="w-3 h-3 bg-accent rounded-full"></div>
					<div>
						<span className="font-medium text-text">
							Weekly (Every Friday at 2:00 PM)
						</span>
						<p className="text-sm text-text-muted">
							Cutoff: Thursday at 12:00 PM
						</p>
					</div>
				</div>
			</div>

			{/* Success Message */}
			{success && (
				<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
					<p className="text-green-800 dark:text-green-200 text-sm font-medium">
						✅ Payout settings updated successfully!
					</p>
				</div>
			)}

			{/* Error Message */}
			{error && (
				<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
					<p className="text-red-800 dark:text-red-200 text-sm font-medium">
						❌ {error}
					</p>
				</div>
			)}

			{/* Current Schedule Info */}
			<div className="bg-surface rounded-2xl p-6 border border-stroke">
				<h3 className="text-lg font-semibold text-text mb-2">
					Current Schedule
				</h3>
				<div className="flex items-center gap-3">
					<div className="w-3 h-3 bg-accent rounded-full"></div>
					<span className="font-medium text-text">
						{getLabel(currentSchedule)} ({getTimelineDays(currentSchedule)}{" "}
						business day
						{getTimelineDays(currentSchedule) !== 1 ? "s" : ""})
					</span>
					{getFeePercent(currentSchedule) > 0 && (
						<span className="text-sm text-text-muted">
							- {getFeePercent(currentSchedule)}% fee
						</span>
					)}
				</div>
			</div>

			{/* Schedule Selector */}
			<PayoutScheduleSelector
				currentSchedule={selectedSchedule}
				onScheduleChange={handleScheduleSelect}
				onSave={handleScheduleChange}
				isLoading={isSaving}
			/>

			{/* Fee Calculator */}
			<PayoutFeeCalculator
				selectedSchedule={selectedSchedule}
				estimatedEarnings={estimatedEarnings}
			/>

			{/* Info Section */}
			<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
				<h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
					💡 How Payout Schedules Work
				</h3>
				<div className="space-y-4">
					<div>
						<h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
							Event Earnings
						</h4>
						<ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
							<li>• Always paid weekly (every Friday at 2 PM)</li>
							<li>• No fees for event earnings</li>
							<li>• Automatic processing</li>
						</ul>
					</div>
					<div>
						<h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
							Store Earnings
						</h4>
						<ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
							<li>
								• <strong>Standard (Weekly):</strong> No fees, every 7 business
								days
							</li>
							<li>
								• <strong>Faster Options:</strong> Pay a small fee to receive
								sooner
							</li>
							<li>
								• <strong>Fee Cap:</strong> Maximum fee is capped to protect
								your earnings
							</li>
							<li>
								• <strong>Customizable:</strong> Choose your preferred schedule
								above
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
