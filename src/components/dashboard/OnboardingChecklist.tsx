"use client";

import { useBrandOnboardingStatus } from "@/hooks/useBrandOnboardingStatus";
import {
	Circle,
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

	if (loading) {
		return (
			<div></div>
			// <div className="rounded-2xl border border-stroke bg-bg overflow-hidden transition-all animate-pulse">
			// 	<div className="p-5">
			// 		<div className="flex items-start justify-between gap-4">
			// 			<div className="flex-1 space-y-2">
			// 				<div className="h-5 w-48 bg-stroke rounded-md"></div>
			// 				<div className="h-4 w-64 bg-stroke/60 rounded-md"></div>
			// 			</div>
			// 			<div className="h-8 w-8 bg-stroke rounded-md"></div>
			// 		</div>
			// 		<div className="mt-5 h-1.5 w-full bg-stroke rounded-full"></div>
			// 		<div className="mt-6">
			// 			<div className="h-10 w-32 bg-stroke rounded-xl"></div>
			// 		</div>
			// 	</div>
			// </div>
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

	// Time estimates map
	const timeEstimates = {
		bank: "2 min",
		profile: "2 min",
		shipping: "5 min",
		product: "3 min",
	};

	// Filter for incomplete steps only
	const incompleteSteps = steps.filter((step) => !step.isComplete);
	const completedCount = steps.length - incompleteSteps.length;
	const totalSteps = steps.length;

	return (
		<div className="rounded-2xl border-none bg-bg overflow-hidden transition-all">
			<div className="px-2 pt-5 pb-6">
				{/* Header Section */}
				<div className="flex flex-col gap-3">
					<div>
						<h2 className="font-heading font-medium text-base">
							Finished setting up your account
						</h2>
						<div className="flex items-center gap-3 mt-2">
							<span className="text-sm text-text">
								{percentage}%
							</span>
							<div className="h-2 flex-1 bg-stroke rounded-full overflow-hidden max-w-[200px]">
								<div
									className="h-full bg-cta transition-all duration-500 ease-out"
									style={{ width: `${percentage}%` }}
								/>
							</div>
						</div>
						<p className="text-text-muted text-xs mt-1.5 font-medium italic">
							<span className="text-cta">
								{completedCount} of {totalSteps}
							</span>{" "}
							tasks completed
						</p>
					</div>
				</div>

				{/* Carousel Section */}
				<div className="mt-6 relative group">
					<div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5 scrollbar-hide">
						{incompleteSteps.map((step) => {
							const Icon = icons[step.id as keyof typeof icons] || Circle;
							const timeEstimate =
								timeEstimates[step.id as keyof typeof timeEstimates];

							return (
								<div
									key={step.id}
									className="snap-center shrink-0 w-[240px] sm:w-[260px] bg-bg rounded-xl border border-stroke p-4 flex flex-col justify-between hover:border-cta/50 transition-colors"
								>
									<div className="space-y-3">
										<div className="flex items-start justify-between">
											<div className="h-9 w-9 rounded-lg bg-surface border border-stroke flex items-center justify-center text-text-muted">
												<Icon className="w-4 h-4" />
											</div>
											{timeEstimate && (
												<span className="text-[10px] font-medium text-text-muted bg-surface border border-stroke px-2 py-1 rounded-full">
													{timeEstimate}
												</span>
											)}
										</div>

										<div>
											<h3 className="font-medium text-text text-sm leading-tight">
												{step.title}
											</h3>
											<p className="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2">
												{step.description}
											</p>
										</div>
									</div>

									<div className="mt-4 flex justify-end">
										<button
											onClick={() => router.push(step.href)}
											className="flex items-center gap-1.5 text-xs font-medium text-text hover:text-cta transition-colors"
										>
											{step.actionType === "modal" ? "Open" : "Start"}
											<ArrowRight className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
