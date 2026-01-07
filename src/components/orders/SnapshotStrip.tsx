import React from "react";
import { cn } from "@/lib/utils";

export interface SnapshotItem {
	label: string;
	value: string | number;
	onClick?: () => void;
	active?: boolean;
}

interface SnapshotStripProps {
	items: SnapshotItem[];
	className?: string;
}

export default function SnapshotStrip({
	items,
	className,
}: SnapshotStripProps) {
	return (
		<div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-4", className)}>
			{items.map((item, index) => (
				<button
					key={index}
					onClick={item.onClick}
					disabled={!item.onClick}
					className={cn(
						"flex flex-col items-start justify-center p-3 rounded-xl border transition-all text-left",
						item.active
							? "bg-surface border-stroke shadow-sm"
							: "bg-surface border-transparent hover:border-stroke/50",
						!item.onClick && "cursor-default hover:border-transparent"
					)}
				>
					<span className="text-xs font-medium text-text-muted uppercase tracking-wide">
						{item.label}
					</span>
					<span className="text-xl font-heading font-semibold text-text mt-1">
						{item.value}
					</span>
				</button>
			))}
		</div>
	);
}
