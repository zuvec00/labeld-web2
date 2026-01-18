"use client";

import { Sparkles } from "lucide-react";

interface ProInsightProps {
	message: string;
	type?: "success" | "info" | "warning";
}

export default function ProInsight({
	message,
	type = "info",
}: ProInsightProps) {
	const bgColors = {
		success: "bg-green-500/5 border-green-500/20",
		info: "bg-accent/5 border-accent/20",
		warning: "bg-orange-500/5 border-orange-500/20",
	};

	const textColors = {
		success: "text-green-600",
		info: "text-accent",
		warning: "text-orange-600",
	};

	return (
		<div
			className={`mt-3 p-3 rounded-lg border ${bgColors[type]} flex items-start gap-2`}
		>
			<Sparkles
				className={`w-4 h-4 ${textColors[type]} flex-shrink-0 mt-0.5`}
			/>
			<p className={`text-xs ${textColors[type]}`}>{message}</p>
		</div>
	);
}
