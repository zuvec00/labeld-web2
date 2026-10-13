import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
	label: string;
	/** Navigates with next/link. Takes precedence over onClick. */
	href?: string;
	onClick?: () => void;
}

export interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: EmptyStateAction;
	/** "dashed" for in-grid placeholders, "plain" when already inside a card. */
	variant?: "dashed" | "plain";
	size?: "sm" | "md";
	className?: string;
}

const actionClass =
	"inline-block mt-2 text-xs text-cta hover:text-cta/80 transition-colors";

/**
 * Empty state with an optional call to action.
 *
 * Only render this once data has finished loading: while a query is in flight
 * use a skeleton (see `DataState`), otherwise users briefly see "No x yet" for
 * content that exists.
 */
export default function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	variant = "dashed",
	size = "md",
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"text-center",
				size === "md" ? "p-8" : "p-4",
				variant === "dashed" && "rounded-xl border border-dashed border-stroke",
				className
			)}
		>
			{Icon && (
				<Icon
					className={cn(
						"text-text-muted mx-auto mb-2",
						size === "md" ? "w-8 h-8" : "w-6 h-6"
					)}
				/>
			)}
			<p className="text-sm text-text-muted">{title}</p>
			{description && (
				<p className="text-xs text-text-muted mt-1">{description}</p>
			)}
			{action &&
				(action.href ? (
					<Link href={action.href} className={actionClass}>
						{action.label}
					</Link>
				) : (
					<button type="button" onClick={action.onClick} className={actionClass}>
						{action.label}
					</button>
				))}
		</div>
	);
}
