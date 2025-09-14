// components/GatedNavClient.tsx (Client Component)
"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

export function GatedNavClient({
	href,
	icon,
	label,
	badge,
	enabled,
	className = "",
}: {
	feature: "events" | "orders" | "wallet" | "sales" | "brandspace";
	href: string;
	icon?: React.ReactNode;
	label: string;
	badge?: string;
	enabled: boolean;
	className?: string;
}) {
	if (enabled) {
		return (
			<Link
				href={href}
				prefetch={true}
				className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface/50 hover:text-accent transition-colors group ${className}`}
			>
				<div className="group-hover:text-accent transition-colors">{icon}</div>
				<span className="text-text group-hover:text-accent transition-colors font-medium">
					{label}
				</span>
				{badge && (
					<span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-cta/10 text-cta border border-cta/20">
						{badge}
					</span>
				)}
			</Link>
		);
	}

	return (
		<div
			aria-disabled="true"
			className={`flex items-center gap-3 px-3 py-2 rounded-xl opacity-60 cursor-not-allowed relative group ${className}`}
			title="Coming this season"
		>
			{icon ? (
				<div className="relative">
					{icon}
					<Lock className="w-3 h-3 absolute -top-1 -right-1 text-text-muted" />
				</div>
			) : (
				<Lock className="w-4 h-4 text-text-muted" />
			)}

			<span className="text-text-muted font-medium">{label}</span>

			<div className="ml-auto flex items-center gap-2">
				<span className="text-xs px-2 py-0.5 rounded-full bg-edit/10 text-edit border border-edit/20 flex items-center gap-1">
					<Sparkles className="w-3 h-3" />
					Dropping soon
				</span>
			</div>
		</div>
	);
}
