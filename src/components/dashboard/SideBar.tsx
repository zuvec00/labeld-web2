"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "./nav";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function Sidebar() {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const { signOutApp } = useAuth();

	return (
		<nav className="w-full h-full flex flex-col">
			{/* Brand header */}
			<div className="flex items-center justify-between p-4 border-b border-stroke">
				{/* mobile toggle */}
				<button
					className="lg:hidden text-text-muted"
					onClick={() => setOpen((s) => !s)}
					aria-label="Toggle menu"
				>
					☰
				</button>
			</div>

			<div
				className={`flex-1 overflow-y-auto ${
					open ? "block" : "hidden"
				} lg:block`}
			>
				{NAV_SECTIONS.map((section, i) => (
					<div key={i} className="px-3 py-4">
						{section.title && (
							<div className="px-3 text-xs uppercase tracking-wide text-text-muted/70 mb-2">
								{section.title}
							</div>
						)}
						<ul className="space-y-1">
							{section.items.map((item) => {
								const active =
									pathname === item.href ||
									pathname?.startsWith(item.href + "/");

								// All navigation items are now regular nav items, no gating
								return (
									<li key={item.href}>
										<Link
											href={item.href}
											prefetch={true}
											className={[
												"flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group",
												active
													? "bg-cta text-text"
													: "text-text hover:text-accent hover:bg-surface/50",
											].join(" ")}
										>
											<div className="group-hover:text-accent transition-colors">
												{item.icon}
											</div>
											<span className="font-medium">{item.label}</span>
											{item.badge && (
												<span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-surface border border-stroke">
													{item.badge}
												</span>
											)}
										</Link>
									</li>
								);
							})}
						</ul>
					</div>
				))}

				{/* Logout */}
				<div className="mt-auto px-3 py-4">
					<button
						className="w-full rounded-xl bg-surface border border-stroke px-3 py-2 text-left hover:bg-surface/80"
						onClick={signOutApp}
					>
						Log out
					</button>
				</div>
			</div>
		</nav>
	);
}
