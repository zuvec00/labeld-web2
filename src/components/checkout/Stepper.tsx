"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";

const steps = [
	{ id: "tickets", label: "Tickets", path: "tickets" },
	{ id: "merch", label: "Merch", path: "merch" },
	{ id: "contact", label: "Contact", path: "contact" },
	{ id: "pay", label: "Pay", path: "pay" },
];

export default function Stepper() {
	const pathname = usePathname();
	const currentStep = pathname.split("/").pop() || "tickets";

	const getStepStatus = (stepPath: string) => {
		const stepIndex = steps.findIndex((s) => s.path === stepPath);
		const currentIndex = steps.findIndex((s) => s.path === currentStep);

		if (stepIndex < currentIndex) return "completed";
		if (stepIndex === currentIndex) return "current";
		return "upcoming";
	};

	return (
		<div className="flex items-center justify-center">
			<div className="flex items-center space-x-4">
				{steps.map((step, index) => {
					const status = getStepStatus(step.path);
					const isLast = index === steps.length - 1;

					return (
						<div key={step.id} className="flex items-center">
							{/* Step Circle */}
							<div className="flex items-center justify-center">
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
										status === "completed"
											? "bg-accent text-black"
											: status === "current"
											? "bg-cta text-black"
											: "bg-surface border border-stroke text-text-muted"
									}`}
								>
									{status === "completed" ? (
										<Check className="w-4 h-4" />
									) : (
										index + 1
									)}
								</div>
							</div>

							{/* Step Label */}
							<div className="ml-3">
								<span
									className={`text-sm font-medium transition-colors duration-200 ${
										status === "completed"
											? "text-accent"
											: status === "current"
											? "text-cta"
											: "text-text-muted"
									}`}
								>
									{step.label}
								</span>
							</div>

							{/* Connector Line */}
							{!isLast && <div className="mx-4 w-8 h-px bg-stroke" />}
						</div>
					);
				})}
			</div>
		</div>
	);
}
