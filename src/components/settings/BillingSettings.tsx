"use client";

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

export default function BillingSettings() {
	const { roleDetection, loading } = useDashboardContext();
	const router = useRouter();

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

	// Formatting helpers
	const formatDate = (date?: Date) => {
		if (!date) return "—";
		return new Intl.DateTimeFormat("en-NG", {
			year: "numeric",
			month: "long",
			day: "numeric",
		}).format(date);
	};

	const getStatusColor = (s: string) => {
		switch (s) {
			case "active":
				return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
			case "past_due":
				return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
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
			default:
				return s.charAt(0).toUpperCase() + s.slice(1);
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
											status
										)}`}
									>
										{getStatusLabel(status)}
									</span>
								)}
							</div>
							<p className="text-sm text-text-muted">
								{isPro
									? `Billed ${
											cycle || "monthly"
									  } • Next invoice on ${formatDate(endsAt)}`
									: "Basic features for getting started."}
							</p>
						</div>
					</div>

					<div>
						{isPro ? (
							<Button
								text="Manage Subscription"
								variant="secondary"
								onClick={() => {
									// TODO: Redirect to Customer Portal (future)
									alert("Subscription management portal coming soon.");
								}}
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
									<span>Renewal Date</span>
								</div>
								<p className="text-text text-base ml-6">{formatDate(endsAt)}</p>
							</div>

							<div className="space-y-1">
								<div className="flex items-center gap-2 text-text-muted text-sm font-medium mb-1">
									<Clock className="w-4 h-4" />
									<span>Billing Cycle</span>
								</div>
								<p className="text-text text-base ml-6 capitalize">
									{cycle || "Monthly"}
								</p>
							</div>
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

			{/* 3. Invoices / History (Placeholder for V1) */}
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
		</div>
	);
}
