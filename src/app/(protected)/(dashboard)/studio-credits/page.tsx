"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useStudioCredits } from "@/hooks/useStudioCredits";
import {
	aiLimit,
	bgRemovalRemaining,
	bgRemovalTotal,
} from "@/lib/models/credits";
import Button from "@/components/ui/button";
import DataState from "@/components/ui/DataState";
import { Skeleton } from "@/components/ui/skeleton";
import PurchaseCreditsDialog from "@/components/waitlist/PurchaseCreditsDialog";

const n = (v: number) => v.toLocaleString();

export default function StudioCreditsPage() {
	const { user } = useAuth();
	const { roleDetection } = useDashboardContext();
	const { loading, error, messaging, ai, bgRemoval } = useStudioCredits();
	const [showTopUp, setShowTopUp] = useState(false);

	const isPro = roleDetection?.brandSubscriptionTier === "pro";

	// AI: monthly allowance; the backend writes the count as it is used
	const aiTotal = aiLimit(isPro);
	const aiUsed = ai?.count ?? 0;
	const aiRemaining = Math.min(Math.max(aiTotal - aiUsed, 0), aiTotal);

	const bgTotal = bgRemovalTotal(bgRemoval, isPro);
	const bgLeft = Math.max(bgRemovalRemaining(bgRemoval, isPro), 0);

	return (
		<div className="max-w-3xl space-y-8 pb-20">
			<div>
				<h1 className="text-2xl font-heading font-semibold text-text">
					Studio Credits
				</h1>
				<p className="text-text-muted mt-1">
					Your credits are split into different categories based on what they
					do and how they reset. They are not combined.
				</p>
			</div>

			<DataState
				loading={loading}
				error={error}
				errorTitle="Couldn't load your credits"
				skeleton={
					<div className="space-y-4">
						{[0, 1, 2].map((i) => (
							<Skeleton key={i} className="h-44 rounded-2xl" />
						))}
					</div>
				}
				empty={null}
			>
				<div className="space-y-4">
					<CreditCard
						title="AI Generations"
						badge="Monthly Reset"
						remaining={aiRemaining}
						total={aiTotal}
						progress={aiTotal ? aiUsed / aiTotal : 0}
						description="Used for AI copywriting and suggestions. This allowance resets on the 1st of every month."
						lastUpdated={ai?.lastCheckedTier ?? new Date()}
					/>

					<CreditCard
						title="Background Removals"
						badge="One-Time Allowance"
						remaining={bgLeft}
						total={bgTotal}
						progress={bgTotal ? (bgTotal - bgLeft) / bgTotal : 0}
						description="Used for automatic background removal on product images and brand logos. This is a one-time allowance and does not reset."
						lastUpdated={bgRemoval?.lastCheckedTier ?? new Date()}
					/>

					<CreditCard
						title="Messaging Credits"
						badge="Top-Up Required"
						remaining={messaging.balance}
						description="Used for sending customer and waitlist emails. You must top up these credits when they run out."
						extra={`Total used: ${n(messaging.totalUsed)}`}
						lastUpdated={messaging.updatedAt ?? new Date()}
						action={
							<Button
								text="Top Up Credits"
								variant="primary"
								onClick={() => setShowTopUp(true)}
							/>
						}
					/>
				</div>
			</DataState>

			<PurchaseCreditsDialog
				open={showTopUp}
				onClose={() => setShowTopUp(false)}
				brandId={user?.uid ?? ""}
				email={user?.email}
			/>
		</div>
	);
}

function CreditCard({
	title,
	badge,
	remaining,
	total,
	progress,
	description,
	extra,
	lastUpdated,
	action,
}: {
	title: string;
	badge: string;
	remaining: number;
	/** Omit for balances without a cap (messaging). */
	total?: number;
	/** 0 to 1, how much has been used. */
	progress?: number;
	description: string;
	extra?: string;
	lastUpdated: Date | null;
	action?: React.ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-stroke bg-surface p-6 space-y-4">
			<div className="flex items-start justify-between gap-3">
				<h2 className="font-medium text-text">{title}</h2>
				<span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-bg border border-stroke text-text-muted whitespace-nowrap">
					{badge}
				</span>
			</div>

			<div className="flex items-baseline gap-2">
				<span className="text-3xl font-heading font-semibold text-text">
					{n(remaining)}
				</span>
				<span className="text-sm text-text-muted">
					{total != null ? `/ ${n(total)} left` : "credits remaining"}
				</span>
			</div>

			{total != null && progress != null && (
				<div
					className="h-2 w-full rounded-full bg-stroke overflow-hidden"
					role="progressbar"
					aria-valuemin={0}
					aria-valuemax={total}
					aria-valuenow={remaining}
				>
					<div
						className="h-full bg-cta transition-all"
						style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
					/>
				</div>
			)}

			<p className="text-sm text-text-muted leading-relaxed">{description}</p>
			{extra && <p className="text-sm font-medium text-text">{extra}</p>}

			<div className="flex items-center justify-between gap-3 pt-1">
				<span className="text-xs text-text-muted">
					{lastUpdated
						? `Last updated: ${format(lastUpdated, "MMM d, yyyy h:mm a")}`
						: ""}
				</span>
				{action}
			</div>
		</div>
	);
}
