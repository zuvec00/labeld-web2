"use client";

import { useState } from "react";
import { useBrandOnboardingStatus } from "@/hooks/useBrandOnboardingStatus";
import {
	CheckCircle2,
	Circle,
	ChevronRight,
	ChevronDown,
	ChevronUp,
	Store,
	CreditCard,
	Truck,
	Shirt,
	ArrowRight,
} from "lucide-react"; // Icons for steps
import { useRouter } from "next/navigation";

export default function OnboardingChecklist() {
	const { steps, percentage, isComplete, loading } = useBrandOnboardingStatus();
	const router = useRouter();
	const [expanded, setExpanded] = useState(false);

	if (loading) {
		return (
			<div className="rounded-2xl border border-stroke bg-surface overflow-hidden transition-all animate-pulse">
				<div className="p-6">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1 space-y-2">
							<div className="h-5 w-48 bg-stroke rounded-md"></div>
							<div className="h-4 w-64 bg-stroke/60 rounded-md"></div>
						</div>
						<div className="h-8 w-8 bg-stroke rounded-md"></div>
					</div>
					<div className="mt-6 h-1.5 w-full bg-stroke rounded-full"></div>
					<div className="mt-8">
						<div className="h-12 w-40 bg-stroke rounded-xl"></div>
					</div>
				</div>
			</div>
		);
	}
	if (isComplete) return null; // Hide when done

	// Icons map
	const icons = {
		bank: CreditCard,
		profile: Store,
		shipping: Truck,
		product: Shirt,
	};

	// Find next step (first incomplete step)
	const nextStep = steps.find((s) => !s.isComplete);

	return (
		<div className="rounded-2xl border border-stroke bg-surface overflow-hidden transition-all">
			{/* Compact Header View */}
			<div className="p-6">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1">
						<h2 className="font-heading font-semibold text-md sm:text-lg">
							Complete your onboarding
						</h2>
						<p className="text-text-muted text-xs sm:text-sm mt-1">
							Complete the next steps to launch your website
						</p>
					</div>
					<button
						onClick={() => setExpanded(!expanded)}
						className="p-2 -mr-2 text-text-muted hover:text-text transition-colors"
					>
						{expanded ? (
							<ChevronUp className="w-5 h-5" />
						) : (
							<ChevronDown className="w-5 h-5" />
						)}
					</button>
				</div>

				{/* Progress Bar */}
				<div className="mt-4 h-1.5 w-full bg-stroke rounded-full overflow-hidden">
					<div
						className="h-full bg-cta transition-all duration-500 ease-out"
						style={{ width: `${percentage}%` }}
					/>
				</div>

				{/* Primary Next Action */}
				{!expanded && nextStep && (
					<div className="mt-6">
						<button
							onClick={() => router.push(nextStep.href)}
							className="w-full sm:w-auto flex items-center sm:items-center justify-center gap-2 px-6 py-3 bg-cta text-white font-medium rounded-xl text-sm sm:text-md hover:opacity-90 transition-all shadow-sm shadow-cta/20"
						>
							Next Step: {nextStep.cta}
							<ArrowRight className="w-4 h-4" />
						</button>
					</div>
				)}
			</div>

			{/* Expanded Steps List */}
			{expanded && (
				<div className="border-t border-stroke divide-y divide-stroke animate-in slide-in-from-top-2 duration-200">
					{steps.map((step) => {
						const Icon = icons[step.id as keyof typeof icons] || Circle;

						return (
							<div
								key={step.id}
								onClick={() => !step.isComplete && router.push(step.href)}
								className={`group p-4 sm:p-6 flex items-start gap-4 transition-colors ${
									step.isComplete
										? "bg-surface opacity-60"
										: "bg-surface hover:bg-bg cursor-pointer"
								}`}
							>
								{/* Status Icon */}
								<div className="shrink-0 mt-0.5">
									{step.isComplete ? (
										<div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-accent">
											<CheckCircle2 className="w-4 h-4" />
										</div>
									) : (
										<div className="h-6 w-6 rounded-lg bg-surface border border-stroke flex items-center justify-center text-text-muted">
											<Icon className="w-3.5 h-3.5" />
										</div>
									)}
								</div>

								{/* Content */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-4">
										<h3
											className={`font-medium text-[15px] ${
												step.isComplete
													? "text-text-muted line-through decoration-stroke"
													: "text-text"
											}`}
										>
											{step.title}
										</h3>
										{step.isComplete && (
											<span className="shrink-0 text-xs font-medium text-accent bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10">
												Completed
											</span>
										)}
									</div>
									{!step.isComplete && (
										<p className="text-sm text-text-muted mt-1 leading-relaxed">
											{step.description}
										</p>
									)}
								</div>

								{/* Action Arrow (only if incomplete) */}
								{!step.isComplete && (
									<div className="shrink-0 self-center text-text-muted group-hover:text-text transition-colors">
										<ChevronRight className="w-5 h-5" />
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
