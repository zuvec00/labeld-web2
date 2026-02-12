"use client";

import { useEventOnboardingStatus } from "@/hooks/useEventOnboardingStatus";
import { useTutorial } from "@/hooks/useTutorial";
import {
	Circle,
	CreditCard,
	Ticket,
	Calendar,
	ArrowRight,
	Play,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function EventOnboardingChecklist() {
	const { steps, percentage, isComplete, loading } = useEventOnboardingStatus();
	const { startTour } = useTutorial();
	const router = useRouter();

	if (loading) {
		return <div></div>;
	}
	if (isComplete) return null; // Hide when done

	// Icons map
	const icons = {
		bank: CreditCard,
		profile: Calendar,
		event: Calendar,
		tickets: Ticket,
	};

	// Time estimates map
	const timeEstimates = {
		bank: "2 min",
		profile: "2 min",
		event: "5 min",
		tickets: "3 min",
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
					<div className="flex items-start justify-between">
						<div>
							<h2 className="font-heading font-medium text-base">
								Finish setting up your account
							</h2>
							<div className="flex items-center gap-3 mt-2">
								<span className="text-sm text-text">{percentage}%</span>
								<div className="h-2 flex-1 w-32 bg-stroke rounded-full overflow-hidden">
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
						<button
							onClick={() => startTour("event-setup")}
							className="text-xs font-medium text-cta hover:text-cta/80 transition-colors flex items-center gap-1.5 bg-cta/10 px-3 py-1.5 rounded-lg"
						>
							<Play className="w-3.5 h-3.5 fill-current" />
							Start Tour
						</button>
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
											className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
												step.cta.includes("First")
													? "text-text-muted cursor-not-allowed"
													: "text-text hover:text-cta"
											}`}
											disabled={step.cta.includes("First")}
										>
											{step.actionType === "modal" ? "Open" : step.cta}
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
