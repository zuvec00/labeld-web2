import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
	title?: string;
	/** Short, user-readable reason. Avoid raw error objects. */
	message?: string;
	onRetry?: () => void;
	size?: "sm" | "md";
	className?: string;
}

/**
 * Error state with an optional retry. Mirrors the mobile pattern of keeping
 * the user in place and offering a way to try again instead of a blank card.
 */
export default function ErrorState({
	title = "Something went wrong",
	message,
	onRetry,
	size = "md",
	className,
}: ErrorStateProps) {
	return (
		<div
			role="alert"
			className={cn(
				"text-center rounded-xl border border-alert/20 bg-alert/5",
				size === "md" ? "p-8" : "p-4",
				className
			)}
		>
			<AlertTriangle
				className={cn(
					"text-alert mx-auto mb-2",
					size === "md" ? "w-8 h-8" : "w-6 h-6"
				)}
			/>
			<p className="text-sm font-medium text-text">{title}</p>
			{message && <p className="text-xs text-text-muted mt-1">{message}</p>}
			{onRetry && (
				<button
					type="button"
					onClick={onRetry}
					className="inline-flex items-center gap-1 mt-3 text-xs text-cta hover:text-cta/80 transition-colors"
				>
					<RefreshCw className="w-3 h-3" />
					Try again
				</button>
			)}
		</div>
	);
}
