// app/(protected)/(dashboard)/bookings/layout.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
	{ label: "Requests", href: "/bookings" },
	{ label: "Availability", href: "/bookings/availability" },
	{ label: "Check-ins", href: "/bookings/check-ins" },
];

export default function BookingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	return (
		<div className="flex flex-col h-full">
			{/* Sub-navigation Tabs */}
			<div className="px-6 pt-6 -mb-4 overflow-x-auto scrollbar-hide">
				<div className="flex items-center gap-1 border-b border-stroke min-w-max">
					{TABS.map((tab) => {
						const isActive = pathname === tab.href;
						return (
							<Link
								key={tab.href}
								href={tab.href}
								className={cn(
									"px-4 py-3 text-sm font-medium transition-all relative border-b-2",
									isActive
										? "text-primary border-primary"
										: "text-text-muted border-transparent hover:text-text",
								)}
							>
								{tab.label}
							</Link>
						);
					})}
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">{children}</div>
		</div>
	);
}
