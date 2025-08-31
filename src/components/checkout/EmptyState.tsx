"use client";

import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmptyStateProps {
	title: string;
	description: string;
	actionLabel?: string;
	actionHref?: string;
	showBackButton?: boolean;
}

export default function EmptyState({
	title,
	description,
	actionLabel,
	actionHref,
	showBackButton = false,
}: EmptyStateProps) {
	const router = useRouter();

	const handleAction = () => {
		if (actionHref) {
			router.push(actionHref);
		}
	};

	const handleBack = () => {
		router.back();
	};

	return (
		<div className="bg-surface rounded-2xl border border-stroke p-8 text-center">
			<div className="w-16 h-16 bg-stroke rounded-full flex items-center justify-center mx-auto mb-4">
				<ShoppingCart className="w-8 h-8 text-text-muted" />
			</div>

			<h3 className="text-lg font-heading font-semibold text-text mb-2">
				{title}
			</h3>

			<p className="text-text-muted mb-6 max-w-sm mx-auto">{description}</p>

			<div className="flex items-center justify-center gap-3">
				{showBackButton && (
					<button
						onClick={handleBack}
						className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>Go back</span>
					</button>
				)}

				{actionLabel && actionHref && (
					<button
						onClick={handleAction}
						className="bg-cta hover:bg-cta/90 text-black font-heading font-semibold px-6 py-2 rounded-xl transition-all duration-200"
					>
						{actionLabel}
					</button>
				)}
			</div>
		</div>
	);
}
