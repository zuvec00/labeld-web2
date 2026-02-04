import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?:
		| "primary"
		| "secondary"
		| "outline"
		| "success"
		| "successEvents"
		| "danger"
		| "warning";
	children: React.ReactNode;
}

export function Badge({
	variant = "primary",
	className,
	children,
	...props
}: BadgeProps) {
	let variantStyles = "";

	switch (variant) {
		case "primary":
			variantStyles = "bg-primary/10 text-primary border-primary/20";
			break;
		case "secondary":
			variantStyles = "bg-bg-subtle text-text-muted border-stroke";
			break;
		case "outline":
			variantStyles = "bg-transparent text-text border-stroke";
			break;
		case "success":
			variantStyles = "bg-green-500/10 text-green-600 border-green-500/20";
			break;
		case "successEvents":
			variantStyles = "bg-events/10 text-events border-events/20";
			break;
		case "danger":
			variantStyles = "bg-red-500/10 text-red-600 border-red-500/20";
			break;
		case "warning":
			variantStyles = "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
			break;
	}

	return (
		<div
			className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${
				className || ""
			}`}
			{...props}
		>
			{children}
		</div>
	);
}
