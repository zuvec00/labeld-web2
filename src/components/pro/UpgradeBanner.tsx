"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UpgradeBannerProps {
	title: string;
	description: string;
	variant?: "default" | "subtle";
	compact?: boolean;
}

export default function UpgradeBanner({
	title,
	description,
	variant = "default",
	compact = false,
}: UpgradeBannerProps) {
	if (compact) {
		return (
			<div className="p-3 rounded-lg border border-cta/20 bg-gradient-to-r from-cta/5 to-transparent flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<Sparkles className="w-4 h-4 text-cta flex-shrink-0" />
					<span className="text-sm text-text truncate">{title}</span>
				</div>
				<Link
					href="/pricing"
					className="text-xs font-medium text-cta hover:text-cta/80 flex-shrink-0"
				>
					Upgrade
				</Link>
			</div>
		);
	}

	return (
		<div
			className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
				variant === "subtle"
					? "border-cta/10 bg-cta/5"
					: "border-cta/20 bg-gradient-to-r from-cta/5 to-transparent"
			}`}
		>
			<div className="flex items-start gap-3">
				<div className="p-1.5 rounded-lg bg-cta/10 mt-0.5">
					<Sparkles className="w-4 h-4 text-cta" />
				</div>
				<div>
					<h3 className="font-heading font-semibold text-text mb-1">{title}</h3>
					<p className="text-sm text-text-muted max-w-xl line-clamp-2">
						{description}
					</p>
				</div>
			</div>
			<Link
				href="/pricing"
				className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-cta text-white text-sm font-semibold rounded-lg hover:bg-cta/90 transition-all shadow-sm hover:shadow-md"
			>
				Upgrade to Pro
				<ArrowRight className="w-4 h-4" />
			</Link>
		</div>
	);
}
