"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "./nav";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useBrandOnboardingStatus } from "@/hooks/useBrandOnboardingStatus";
import MaintenanceModal from "@/components/modals/MaintenanceModal";
import DashboardContextSwitch from "@/components/dashboard/DashboardContextSwitch";
import { Eye } from "lucide-react";

export default function Sidebar({
	onItemClick,
	isMobile = false,
}: {
	onItemClick?: () => void;
	isMobile?: boolean; // Optional prop if we need specific mobile styling
}) {
	const pathname = usePathname();
	const { signOutApp } = useAuth();

	const {
		activeRole,
		setActiveRole,
		roleDetection,
		canSwitchRoles,
		loading: contextLoading,
	} = useDashboardContext();
	const { isComplete } = useBrandOnboardingStatus();
	const [showMaintenance, setShowMaintenance] = useState(false);

	// Local state for sidebar filtering mode: "brand" | "eventOrganizer" | "all"
	const [sidebarMode, setSidebarMode] = useState<
		"brand" | "eventOrganizer" | "all"
	>(activeRole);

	// Sync sidebar mode if activeRole changes externally (e.g. initial load)
	// But if user explicitly selected "all" locally, we might want to keep it?
	// For now, let's just sync defaults to avoid confusion.
	useEffect(() => {
		if (sidebarMode !== "all" && activeRole !== sidebarMode) {
			setSidebarMode(activeRole);
		}
	}, [activeRole, sidebarMode]);

	const handleModeChange = (newMode: "brand" | "eventOrganizer" | "all") => {
		setSidebarMode(newMode);
		if (newMode !== "all") {
			setActiveRole(newMode);
		}
	};

	const handleViewStore = () => {
		if (isComplete) {
			let url = "";

			if (activeRole === "brand") {
				const username = roleDetection?.brandUsername;
				const slug = roleDetection?.brandSlug || username;
				const isPro = roleDetection?.brandSubscriptionTier === "pro";

				if (slug) {
					url = isPro
						? `https://${slug}.labeld.app`
						: `https://shop.labeld.app/${slug}`;
				}
			} else if (activeRole === "eventOrganizer") {
				const username = roleDetection?.organizerName; // Assuming name is usable, or we need a slug
				const slug =
					roleDetection?.eventSlug ||
					username?.toLowerCase().replace(/\s+/g, "-");

				if (slug) {
					// Assuming generic event URL structure for now, can be updated
					url = `https://events.labeld.app/${slug}`;
				}
			}

			if (url) {
				window.open(url, "_blank");
			} else {
				// Fallback or detailed error if needed
				console.warn("Could not determine public URL");
			}
		} else {
			setShowMaintenance(true);
		}
	};

	// --- Filter Logic ---
	const filteredSections = NAV_SECTIONS.map((section) => ({
		...section,
		items: section.items.filter((item) => {
			if (!item.roles) return true; // Show to all
			if (sidebarMode === "all") return true; // Show everything
			if (!activeRole) return true; // Fallback
			return item.roles.includes(sidebarMode as any);
		}),
	})).filter((section) => section.items.length > 0);

	return (
		<nav className="w-full h-full flex flex-col bg-surface border-r border-stroke">
			{/* Header */}
			<div className="h-16 lg:h-[72px] flex items-center gap-2 px-4 border-b border-stroke flex-shrink-0">
				{isMobile ? (
					// Mobile Header - Switcher + View Button
					<div className="w-full flex items-center justify-between gap-2">
						{/* Context Switcher - Flexible width */}
						<div className="flex-1 min-w-0">
							<DashboardContextSwitch
								activeRole={sidebarMode}
								onRoleChange={handleModeChange}
								canSwitch={canSwitchRoles} // Always true now
								isCompact={true}
								includeAll={true}
							/>
						</div>

						{/* View Button - Icon only to save space */}
						<button
							onClick={handleViewStore}
							className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-stroke bg-bg/50 hover:bg-surface hover:border-accent/50 transition-all group"
						>
							<span className="text-sm font-medium text-text group-hover:text-accent transition-colors hidden xs:inline-block">
								{activeRole === "brand" ? "View Store" : "View Events"}
							</span>
							<span className="text-sm font-medium text-text group-hover:text-accent transition-colors xs:hidden">
								View
							</span>
							<Eye className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
						</button>
					</div>
				) : (
					// Desktop Header - Always Switcher
					<div className="w-full flex items-center justify-between">
						<div className="w-full">
							<DashboardContextSwitch
								activeRole={sidebarMode}
								onRoleChange={handleModeChange}
								canSwitch={canSwitchRoles}
								includeAll={true}
							/>
						</div>
					</div>
				)}
			</div>

			<MaintenanceModal
				isOpen={showMaintenance}
				onClose={() => setShowMaintenance(false)}
			/>

			<div className="flex-1 overflow-y-auto py-2 pb-6">
				{filteredSections.map((section, i) => (
					<div key={i} className="px-3 py-3">
						{section.title && (
							<div className="px-3 text-xs uppercase tracking-wide text-text-muted/70 mb-2 font-semibold">
								{section.title}
							</div>
						)}
						<ul className="space-y-0.5">
							{section.items.map((item) => {
								// Check if active
								const isSiteCustomization = pathname?.startsWith(
									"/brand-space/site-customization",
								);
								const isEventSibling =
									pathname?.startsWith("/organizer-space") ||
									pathname?.startsWith("/events/site-customization");

								const active =
									pathname === item.href ||
									(item.href !== "/" &&
										pathname?.startsWith(item.href + "/") &&
										// explicit exception for brand-space parent when on site-customization
										!(item.href === "/brand-space" && isSiteCustomization) &&
										// explicit exception for events parent when on profile or site-customization
										!(item.href === "/events" && isEventSibling));

								return (
									<li key={item.href}>
										<Link
											href={item.href}
											prefetch={true}
											onClick={onItemClick}
											// Data tour attributes
											data-tour={
												item.href === "/brand-space"
													? "brand-space-nav"
													: item.href === "/pieces"
														? "products-nav"
														: item.href === "/events"
															? "events-nav"
															: item.href === "/orders"
																? "orders-nav"
																: item.href === "/wallet"
																	? "wallet-nav"
																	: undefined
											}
											className={[
												"flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
												active
													? "bg-cta/10 text-cta font-medium border border-cta/20"
													: "text-text-muted hover:text-text hover:bg-bg",
											].join(" ")}
										>
											<div
												className={`transition-colors ${
													active ? "text-cta" : "group-hover:text-text"
												}`}
											>
												{item.icon}
											</div>
											<span className="text-sm">{item.label}</span>
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
			</div>

			{/* Fixed Footer: Theme Toggle + Logout */}
			<div className="p-4 border-t border-stroke bg-surface flex-shrink-0">
				<button
					className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors text-sm"
					onClick={signOutApp}
				>
					{/* We could add a logout icon here if we had one in lucide */}
					<span>Log out</span>
				</button>
			</div>
		</nav>
	);
}
