"use client";

import { Sparkles } from "lucide-react";

export default function ProBadge({ size = "sm" }: { size?: "sm" | "md" }) {
	const sizeClasses = {
		sm: "text-[10px] px-2 py-0.5",
		md: "text-xs px-2.5 py-1",
	};

	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent font-medium border border-accent/20 ${sizeClasses[size]}`}
		>
			<Sparkles className="w-2.5 h-2.5" />
			PRO
		</span>
	);
}
