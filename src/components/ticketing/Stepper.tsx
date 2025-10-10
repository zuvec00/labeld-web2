/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter, useParams } from "next/navigation";

interface Step {
	key: string;
	label: string;
	optional?: boolean;
}
export default function Stepper({
	steps,
	activeKey,
	eventId,
}: {
	steps: Step[];
	activeKey: string;
	eventId?: string;
}) {
	const router = useRouter();
	const params = useParams<{ eventId?: string }>();

	// Use eventId from props or params
	const currentEventId = eventId || params.eventId;

	// Handle step navigation
	const handleStepClick = (stepKey: string) => {
		if (!currentEventId) return;

		// Don't navigate if clicking on current step
		if (stepKey === activeKey) return;

		// Map step keys to routes
		const routeMap: Record<string, string> = {
			details: `/events/${currentEventId}/details`,
			tickets: `/events/${currentEventId}/tickets`,
			merch: `/events/${currentEventId}/merch`,
			moments: `/events/${currentEventId}/moments`,
			review: `/events/${currentEventId}/review`,
		};

		const route = routeMap[stepKey];
		if (route) {
			router.push(route);
		}
	};

	return (
		<div className="w-full flex items-center gap-3 select-none">
			{steps.map((s, i) => {
				const isActive = s.key === activeKey;
				const isDone = steps.findIndex((x) => x.key === activeKey) > i;
				const isClickable = currentEventId && s.key !== activeKey;
				return (
					<div key={s.key} className="flex items-center w-full">
						<div
							className={[
								"inline-flex items-center gap-2 rounded-full px-3 py-1.5 border transition-colors",
								isActive
									? "border-accent text-accent"
									: isDone
									? "border-stroke text-text"
									: "border-stroke text-text-muted",
								isClickable &&
									"cursor-pointer hover:border-accent/50 hover:text-accent/70",
							].join(" ")}
							onClick={() => isClickable && handleStepClick(s.key)}
							title={isClickable ? `Go to ${s.label}` : undefined}
						>
							<span
								className={[
									"grid place-items-center h-4 w-4 rounded-full border text-xs",
									isActive || isDone
										? "bg-accent border-accent text-bg"
										: "border-stroke",
								].join(" ")}
							>
								{isDone ? "✓" : ""}
							</span>
							<span className="text-sm font-medium">
								{s.label}
								{s.optional ? (
									<span className="ml-1 text-xs text-text-muted">
										(optional)
									</span>
								) : null}
							</span>
						</div>
						{i !== steps.length - 1 && (
							<div className="mx-3 h-px flex-1 bg-stroke" />
						)}
					</div>
				);
			})}
		</div>
	);
}
