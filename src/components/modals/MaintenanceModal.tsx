"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Rocket, ChevronRight, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBrandOnboardingStatus } from "@/hooks/useBrandOnboardingStatus";

export default function MaintenanceModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const { steps } = useBrandOnboardingStatus();
	const remaining = steps.filter((s) => !s.isComplete);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

	if (!isOpen || !mounted) return null; 

	return createPortal(
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 ">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-md"
				onClick={onClose}
			/>

			{/* Content */}
			<div className="relative bg-bg border border-stroke rounded-2xl w-full max-w-[90vw] sm:max-w-sm p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
				{/* Close */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-2 text-text-muted hover:text-text"
				>
					<X className="w-5 h-5" />
				</button>

				<div className="text-center">
					<div className="w-16 h-16 bg-surface border border-stroke rounded-2xl flex items-center justify-center mx-auto mb-6 text-text-muted">
						<Rocket className="w-8 h-8" />
					</div>

					<h3 className="font-heading font-semibold text-xl mb-2">
						Your store isn&apos;t live yet
					</h3>
					<p className="text-text-muted text-sm leading-relaxed mb-5">
						{remaining.length > 0
							? `Finish ${remaining.length === 1 ? "this 1 step" : `these ${remaining.length} steps`} to go live.`
							: "Finish your setup to go live."}
					</p>

					{remaining.length > 0 && (
						<div className="mb-6 text-left divide-y divide-stroke border border-stroke rounded-xl overflow-hidden">
							{remaining.map((step) => (
								<button
									key={step.id}
									onClick={() => {
										onClose();
										router.push(step.href);
									}}
									className="w-full flex items-center gap-3 px-3 py-3 hover:bg-surface transition-colors"
								>
									<Circle className="w-4 h-4 text-text-muted flex-shrink-0" />
									<span className="flex-1 text-sm text-text">{step.title}</span>
									<ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
								</button>
							))}
						</div>
					)}

					<button
						onClick={() => {
							onClose();
							router.push(remaining[0]?.href ?? "/dashboard");
						}}
						className="w-full py-2.5 bg-cta text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
					>
						{remaining.length > 0 ? "Continue setup" : "Go to Dashboard"}
					</button>
				</div>
			</div>
		</div>,
        document.body
	);
}
