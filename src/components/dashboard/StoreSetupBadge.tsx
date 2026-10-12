"use client";

import { useBrandOnboardingStatus } from "@/hooks/useBrandOnboardingStatus";

/** "Not live · N steps left" chip; renders nothing once setup is complete. */
export default function StoreSetupBadge({ className = "" }: { className?: string }) {
	const { steps, isComplete, loading } = useBrandOnboardingStatus();

	if (loading || isComplete || steps.length === 0) return null;

	const left = steps.filter((s) => !s.isComplete).length;

	return (
		<span
			className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-text-muted ${className}`}
		>
			<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
			Not live · {left} {left === 1 ? "step" : "steps"} left
		</span>
	);
}
