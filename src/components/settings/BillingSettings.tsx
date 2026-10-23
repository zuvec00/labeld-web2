"use client";

import { useState } from "react";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import Button from "@/components/ui/button";
import {
	CreditCard,
	CheckCircle2,
	AlertCircle,
	Calendar,
	ShieldCheck,
	Zap,
	Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/app/hooks/use-toast";
import {
	resumeBrandProSubscription,
	retryProSubscriptionCharge,
} from "@/lib/firebase/callables/proBilling";
import CancelProFlowDialog from "./CancelProFlowDialog";

/**
 * Billing & subscription. States and wording follow the mobile billing screen:
 * free trial (no cancel, "Keep Pro"), failed renewal (retry), renewal cancelled
 * (resume) and the normal active plan (cancel via the save flow).
 */
export default function BillingSettings() {
	const { roleDetection, loading } = useDashboardContext();
	const router = useRouter();

	const [retrying, setRetrying] = useState(false);
	const [retryNote, setRetryNote] = useState<{
		message: string;
		needsNewSubscription: boolean;
	} | null>(null);
	const [resuming, setResuming] = useState(false);
	const [showCancel, setShowCancel] = useState(false);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-text-muted animate-pulse">
				<CreditCard className="w-8 h-8 mb-3 opacity-50" />
				<p className="text-sm">Loading billing details...</p>
			</div>
		);
	}

	const tier = roleDetection?.brandSubscriptionTier || "free";
	const isPro = tier === "pro";
	const status = roleDetection?.brandSubscriptionStatus || "active";
	const cycle = roleDetection?.brandBillingCycle;
	const endsAt = roleDetection?.brandSubscriptionEndsAt;
	const isTrial = roleDetection?.brandIsTrial === true;
	const trialEndedAt = roleDetection?.brandTrialEndedAt;

	// On the free Pro trial: Pro, but nothing has been paid yet
	const onTrial = isPro && isTrial;
	// Whole days left, rounded up (same as mobile `trialDaysLeft`)
	const trialDaysLeft =
		onTrial && endsAt && endsAt.getTime() > Date.now()
			? Math.ceil((endsAt.getTime() - Date.now()) / 86_400_000)
			: 0;
	// The free trial was the brand's last plan and it simply ended. That is not
	// a failed payment, so there is nothing to retry.
	const trialWasLastPlan =
		!isPro &&
		!isTrial &&
		!!trialEndedAt &&
		!!endsAt &&
		endsAt.getTime() <= trialEndedAt.getTime();

	// Renewal is cancelled but Pro stays active until the paid period ends
	const cancelling =
		isPro && !onTrial && roleDetection?.brandCancelAtPeriodEnd === true;
	// Failed renewal: still in grace (past_due) or already lapsed (expired)
	const needsRetry =
		(status === "past_due" || status === "expired") && !trialWasLastPlan;

	// Formatting helpers
	const formatDate = (date?: Date) => {
		if (!date) return "—";
		return new Intl.DateTimeFormat("en-NG", {
			year: "numeric",
			month: "long",
			day: "numeric",
		}).format(date);
	};

	const chipStatus =
		onTrial && status === "active"
			? "trial"
			: cancelling
				? "cancelling"
				: status;

	const getStatusColor = (s: string) => {
		switch (s) {
			case "active":
				return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
			case "trial":
				return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
			case "past_due":
				return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
			case "cancelling":
			case "cancelled":
				return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400";
			default:
				return "text-text-muted bg-surface-neutral border-stroke";
		}
	};

	const getStatusLabel = (s: string) => {
		switch (s) {
			case "past_due":
				return "Past Due";
			case "active":
				return "Active";
			case "trial":
				return "Free trial";
			case "cancelling":
				return "Cancelling";
			default:
				return s.charAt(0).toUpperCase() + s.slice(1);
		}
	};

	const handleRetry = async () => {
		setRetrying(true);
		setRetryNote(null);
		try {
			const result = await retryProSubscriptionCharge();
			if (result.ok) {
				toast({
					title: "Payment successful",
					description: result.message,
					duration: 6000,
				});
			} else {
				setRetryNote({
					message: result.message,
					needsNewSubscription: result.needsNewSubscription,
				});
			}
		} catch (e) {
			setRetryNote({
				message:
					(e as { message?: string })?.message ||
					"Could not retry the payment.",
				needsNewSubscription: false,
			});
		} finally {
			setRetrying(false);
		}
	};

	const handleResume = async () => {
		setResuming(true);
		try {
			const res = await resumeBrandProSubscription();
			toast({
				title: res.alreadyActive
					? "Your Pro renewal is already on."
					: "Pro renewal is back on.",
				duration: 5000,
			});
		} catch (e) {
			toast({
				title: "Couldn't restart your renewal",
				description:
					(e as { message?: string })?.message ||
					"Could not restart your renewal. Please try again.",
				variant: "destructive",
				duration: 6000,
			});
		} finally {
			setResuming(false);
		}
	};

	return (
		<div className="space-y-8 max-w-3xl">
			{/* 1. Header Section */}
			<div>
				<h2 className="text-2xl font-heading font-semibold text-text mb-2">
					Billing & Subscription
				</h2>
				<p className="text-text-muted">
					Manage your plan, billing details, and invoices.
				</p>
			</div>

			{/* Failed renewal */}
			{needsRetry && (
				<div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5 space-y-3">
					<div className="flex items-start gap-3">
						<AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
						<p className="text-sm text-text">
							{status === "past_due"
								? "We couldn't charge your card for this renewal. Top it up and retry to keep Pro."
								: "Your last renewal failed and your store moved to Free. Retry with your saved card to get Pro back."}
						</p>
					</div>
					{retryNote && (
						<p className="text-sm text-red-600 dark:text-red-400">
							{retryNote.message}
						</p>
					)}
					<div className="flex flex-wrap items-center gap-3">
						<Button
							text={retrying ? "Retrying..." : "Retry Payment"}
							variant="primary"
							onClick={handleRetry}
							disabled={retrying}
						/>
						{retryNote?.needsNewSubscription && (
							<Button
								text="Subscribe"
								variant="outline"
								onClick={() => router.push("/pricing")}
							/>
						)}
						<span className="text-xs text-text-muted">
							Charges the card already on your account.
						</span>
					</div>
				</div>
			)}

			{/* 2. Current Plan Card */}
			<div className="rounded-2xl border border-stroke bg-surface overflow-hidden">
				{/* Card Header with visual distinction for Pro */}
				<div
					className={`
          px-6 py-6 border-b border-stroke flex flex-col md:flex-row md:items-center justify-between gap-4
          ${isPro ? "bg-surface-neutral/30" : ""}
        `}
				>
					<div className="flex items-start gap-4">
						<div
							className={`
               w-12 h-12 rounded-xl flex items-center justify-center shrink-0
               ${
									isPro
										? "bg-text text-bg"
										: "bg-surface-neutral text-text-muted"
								}
             `}
						>
							{isPro ? (
								<Zap className="w-6 h-6 fill-current" />
							) : (
								<CreditCard className="w-6 h-6" />
							)}
						</div>

						<div>
							<div className="flex items-center gap-3 mb-1">
								<h3 className="text-lg font-bold text-text">
									{isPro ? "Labeld Pro" : "Free Plan"}
								</h3>
								{isPro && (
									<span
										className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getStatusColor(
											chipStatus,
										)}`}
									>
										{getStatusLabel(chipStatus)}
									</span>
								)}
							</div>
							<p className="text-sm text-text-muted">
								{onTrial
									? `Free trial: ${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left`
									: isPro
										? cancelling
											? `Renewal cancelled • Pro stays active until ${formatDate(endsAt)}`
											: `Billed ${cycle || "monthly"} • Next invoice on ${formatDate(endsAt)}`
										: "Basic features for getting started."}
							</p>
						</div>
					</div>

					<div>
						{onTrial ? (
							<Button
								text="Keep Pro"
								variant="primary"
								onClick={() => router.push("/pricing")}
							/>
						) : isPro && !cancelling ? (
							<Button
								text="Cancel Pro Renewal"
								variant="outline"
								onClick={() => setShowCancel(true)}
							/>
						) : isPro && cancelling ? (
							<Button
								text={resuming ? "Restarting..." : "Resume Pro"}
								variant="primary"
								onClick={handleResume}
								disabled={resuming}
							/>
						) : (
							<Button
								text="Upgrade to Pro"
								variant="primary"
								onClick={() => router.push("/pricing")}
							/>
						)}
					</div>
				</div>

				{/* Card Body - Details */}
				<div className="p-6 grid gap-6 sm:grid-cols-2">
					{isPro ? (
						<>
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-text-muted text-sm font-medium mb-1">
									<Calendar className="w-4 h-4" />
									<span>
										{onTrial
											? "Trial Ends"
											: cancelling
												? "Pro Active Until"
												: "Renewal Date"}
									</span>
								</div>
								<p className="text-text text-base ml-6">{formatDate(endsAt)}</p>
							</div>

							{!onTrial && (
								<div className="space-y-1">
									<div className="flex items-center gap-2 text-text-muted text-sm font-medium mb-1">
										<Clock className="w-4 h-4" />
										<span>Billing Cycle</span>
									</div>
									<p className="text-text text-base ml-6 capitalize">
										{cycle || "Monthly"}
									</p>
								</div>
							)}

							{onTrial && (
								<div className="sm:col-span-2 text-sm text-text-muted flex items-start gap-3 bg-surface-neutral/50 p-4 rounded-xl">
									<CheckCircle2 className="w-5 h-5 text-text shrink-0 mt-0.5" />
									<p>
										{endsAt
											? `Nothing is charged. You go back to Free on ${formatDate(endsAt)} unless you keep Pro.`
											: "Nothing is charged. You go back to Free when the trial ends unless you keep Pro."}
									</p>
								</div>
							)}

							{!onTrial && !cancelling && (
								<p className="sm:col-span-2 text-xs text-text-muted">
									You will keep Pro until the current period ends.
								</p>
							)}

							{cancelling && (
								<div className="sm:col-span-2 text-sm text-text-muted flex items-start gap-3 bg-surface-neutral/50 p-4 rounded-xl">
									<CheckCircle2 className="w-5 h-5 text-text shrink-0 mt-0.5" />
									<div className="space-y-1">
										<p className="text-text font-medium">
											{endsAt
												? `Renewal cancelled. Pro until ${formatDate(endsAt)}.`
												: "Renewal cancelled. Pro until your paid period ends."}
										</p>
										<p>
											{endsAt
												? `Changed your mind? Nothing is charged today. Your next payment would be on ${formatDate(endsAt)}.`
												: "Changed your mind? Nothing is charged today."}
										</p>
									</div>
								</div>
							)}
						</>
					) : (
						<div className="col-span-2 text-sm text-text-muted flex items-start gap-3 bg-surface-neutral/50 p-4 rounded-xl">
							<ShieldCheck className="w-5 h-5 text-text shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="text-text font-medium">
									Upgrade to Pro for full access
								</p>
								<p>
									Unlock custom domains, zero fees on your sales, and advanced
									analytics.
								</p>
								<button
									onClick={() => router.push("/pricing")}
									className="text-link font-medium hover:underline mt-1 inline-block"
								>
									View Plans →
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 3. Invoices / History (Placeholder for V1, same as mobile) */}
			{isPro && (
				<div className="rounded-2xl border border-stroke bg-surface p-6 opacity-60 pointer-events-none grayscale">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-lg font-medium text-text">Payment History</h3>
						<span className="text-xs font-medium px-2 py-1 bg-surface-neutral rounded text-text-muted">
							Coming soon
						</span>
					</div>
					<p className="text-sm text-text-muted">
						Invoices and payment receipts will appear here.
					</p>
				</div>
			)}

			<CancelProFlowDialog
				isOpen={showCancel}
				onClose={() => setShowCancel(false)}
				brandName={roleDetection?.brandName || ""}
			/>
		</div>
	);
}
