/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

interface Step {
	key: string;
	label: string;
	optional?: boolean;
}
export default function Stepper({
	steps,
	activeKey,
}: {
	steps: Step[];
	activeKey: string;
}) {
	return (
		<div className="w-full flex items-center gap-3 select-none">
			{steps.map((s, i) => {
				const isActive = s.key === activeKey;
				const isDone = steps.findIndex((x) => x.key === activeKey) > i;
				return (
					<div key={s.key} className="flex items-center w-full">
						<div
							className={[
								"inline-flex items-center gap-2 rounded-full px-3 py-1.5 border",
								isActive
									? "border-accent text-accent"
									: isDone
									? "border-stroke text-text"
									: "border-stroke text-text-muted",
							].join(" ")}
						>
							<span
								className={[
									"grid place-items-center h-4 w-4 rounded-full border",
									isActive || isDone
										? "bg-accent border-accent"
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
