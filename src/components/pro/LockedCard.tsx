"use client";

import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";

interface LockedCardProps {
	title: string;
	description?: string;
	height?: string;
	showUpgrade?: boolean;
	className?: string;
	upgradeUrl?: string;
	buttonClassName?: string;
}

export default function LockedCard({
	title,
	description,
	height = "h-64",
	showUpgrade = true,
	className = "",
	upgradeUrl = "/pricing",
	buttonClassName = "bg-cta hover:bg-cta/90 text-white",
}: LockedCardProps) {
	return (
		<div
			className={`relative rounded-xl border border-stroke bg-surface overflow-hidden ${height} flex items-center justify-center backdrop-blur-sm ${className}`}
		>
			{/* Blurred Background Pattern */}
			<div className="absolute inset-0 bg-gradient-to-br from-cta/5 via-accent/5 to-transparent opacity-50" />

			{/* Content */}
			<div className="relative z-10 text-center px-6 max-w-sm">
				<div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cta/10 mb-4">
					<Lock className="w-6 h-6 text-cta" />
				</div>

				<h3 className="font-heading font-semibold text-lg text-text mb-2">
					{title}
				</h3>

				{description && (
					<p className="text-sm text-text-muted mb-4 line-clamp-2">
						{description}
					</p>
				)}

				{showUpgrade && (
					<Link
						href={upgradeUrl}
						className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md ${buttonClassName}`}
					>
						<Sparkles className="w-4 h-4" />
						Upgrade to Pro
					</Link>
				)}
			</div>
		</div>
	);
}
