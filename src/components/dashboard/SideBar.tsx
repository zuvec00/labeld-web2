"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "./nav";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useBrandOnboardingStatus } from "@/hooks/useBrandOnboardingStatus";
import MaintenanceModal from "@/components/modals/MaintenanceModal";
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

	// Logic duplicated from Topbar for mobile compatibility
	const { activeRole, roleDetection } = useDashboardContext();
	const { isComplete } = useBrandOnboardingStatus();
	const [showMaintenance, setShowMaintenance] = useState(false);

	const handleViewStore = () => {
		if (activeRole !== "brand") return;

		if (isComplete) {
			const username = roleDetection?.brandUsername;
			const slug = roleDetection?.brandSlug || username;
			const isPro = roleDetection?.brandSubscriptionTier === "pro";

			if (slug) {
				const url = isPro
					? `https://${slug}.labeld.app`
					: `https://shop.labeld.app/${slug}`;

				window.open(url, "_blank");
			}
		} else {
			setShowMaintenance(true);
		}
	};

	return (
		<nav className="w-full h-full flex flex-col bg-surface border-r border-stroke">
			{/* Brand Header */}
			<div className="h-16 lg:h-[72px] flex items-center gap-2 px-4 border-b border-stroke flex-shrink-0">
				{isMobile && activeRole === "brand" ? (
					// Mobile Header - View Store Button
					<div className="w-full flex items-center justify-between">
						<button
							onClick={handleViewStore}
							className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-stroke bg-bg/50 hover:bg-surface hover:border-accent/50 transition-all group"
						>
							<span className="text-sm font-medium text-text group-hover:text-accent transition-colors">
								View Store
							</span>
							<Eye className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
						</button>
					</div>
				) : (
					// Desktop Header - Logo
					<>
						<div className="flex flex-col justify-center size-8">
							<Image
								src="/1.svg"
								alt="Labeld"
								width={32}
								height={32}
								className="h-8 w-8"
							/>
						</div>
						<span className="font-heading font-semibold text-lg text-text">
							LABELD STUDIO
						</span>
					</>
				)}
			</div>

			<MaintenanceModal
				isOpen={showMaintenance}
				onClose={() => setShowMaintenance(false)}
			/>

			{/* Brand header - Hidden on mobile sidebar wrapper as it has its own header, or keep it consistent? 
                The design requested removing the hamburger from here. 
                On desktop, this header area might be unneeded if the Topbar covers branding.
                However, usually the sidebar top-left has the logo.
                Looking at current layout: Topbar has "LABELD STUDIO" and Logo.
                So Sidebar probably doesn't need a header on Desktop if it's just navigation.
                But let's keep it simple for now.
            */}

			{/* If we want to hide the header on mobile because MobileSidebar has one, we can check isMobile.
               But MobileSidebar passes children.
               Let's just remove the internal hamburger button logic. 
            */}

			<div className="flex-1 overflow-y-auto py-2">
				{NAV_SECTIONS.map((section, i) => (
					<div key={i} className="px-3 py-2">
						{section.title && (
							<div className="px-3 text-xs uppercase tracking-wide text-text-muted/70 mb-2 font-semibold">
								{section.title}
							</div>
						)}
						<ul className="space-y-0.5">
							{section.items.map((item) => {
								// Check if active
								const isSiteCustomization = pathname?.startsWith(
									"/brand-space/site-customization"
								);
								const active =
									pathname === item.href ||
									(item.href !== "/" &&
										pathname?.startsWith(item.href + "/") &&
										// explicit exception for brand-space parent when on site-customization
										!(item.href === "/brand-space" && isSiteCustomization));

								return (
									<li key={item.href}>
										<Link
											href={item.href}
											prefetch={true}
											onClick={onItemClick}
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

				{/* Logout */}
				<div className="mt-auto px-3 py-4">
					<button
						className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors text-sm"
						onClick={signOutApp}
					>
						{/* We could add a logout icon here if we had one in lucide */}
						<span>Log out</span>
					</button>
				</div>
			</div>
		</nav>
	);
}
