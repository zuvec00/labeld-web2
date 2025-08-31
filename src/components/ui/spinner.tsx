import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

export const Spinner = ({ size = "md", className }: SpinnerProps) => {
	const sizeClasses = {
		sm: "w-6 h-6",
		md: "w-8 h-8",
		lg: "w-10 h-10",
	};

	return (
		<div
			className={cn(
				"relative animate-pulse-brand",
				sizeClasses[size],
				className
			)}
		>
			<div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-burnt-orange via-cyber-lime to-[#F13232] animate-spin">
				<div className="absolute inset-0 rounded-full bg-[#1C1C1C] m-0.5"></div>
			</div>
			<div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-cyber-lime via-[#F13232] to-burnt-orange animate-spin-reverse">
				<div className="absolute inset-0 rounded-full bg-[#1C1C1C] m-0.5"></div>
			</div>
		</div>
	);
};
