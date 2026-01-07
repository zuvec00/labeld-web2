import React from "react";
import { cn } from "@/lib/utils";

export type FilterPill = {
	id: string;
	label: string;
};

interface QuickFilterPillsProps {
	pills: FilterPill[];
	activePillId?: string;
	onSelect: (pillId: string) => void;
	className?: string;
}

export default function QuickFilterPills({
	pills,
	activePillId,
	onSelect,
	className,
}: QuickFilterPillsProps) {
	return (
		<div className={cn("flex flex-wrap gap-2 items-center", className)}>
			<span className="text-xs font-medium text-text-muted mr-1">
				Quick Filters:
			</span>
			{pills.map((pill) => {
				const isActive = activePillId === pill.id;
				return (
					<button
						key={pill.id}
						onClick={() => onSelect(pill.id)}
						className={cn(
							"px-3 py-1 text-xs font-medium rounded-full transition-colors border",
							isActive
								? "bg-text text-bg border-text"
								: "bg-surface text-text hover:bg-surface-hover border-stroke"
						)}
					>
						{pill.label}
					</button>
				);
			})}
			{activePillId && (
				<button
					onClick={() => onSelect("")}
					className="px-2 py-1 text-xs text-text-muted hover:text-text"
				>
					Clear
				</button>
			)}
		</div>
	);
}
