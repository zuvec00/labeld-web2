"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";

import { ExternalLink, Menu, Eye } from "lucide-react";
import { useBrandOnboardingStatus } from "@/hooks/useBrandOnboardingStatus";
import MaintenanceModal from "@/components/modals/MaintenanceModal";
import { useRouter } from "next/navigation";

interface TopbarProps {
	onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
	const router = useRouter();
	const { user } = useAuth();
	const { activeRole, roleDetection } = useDashboardContext();
	const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// Onboarding status for View Store logic
	const { isComplete } = useBrandOnboardingStatus();
	const [showMaintenance, setShowMaintenance] = useState(false);

	useEffect(() => {
		const fetchUserProfile = async () => {
			if (!user) {
				setLoading(false);
				return;
			}

			try {
				const userDocRef = doc(db, "users", user.uid);
				const userDoc = await getDoc(userDocRef);

				if (userDoc.exists()) {
					const userData = userDoc.data();
					setProfileImageUrl(userData.profileImageUrl || null);
				}
			} catch (error) {
				console.error("Error fetching user profile:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchUserProfile();
	}, [user]);

	// Ensure state is never auto-set to true, only on click
	// The previous code was fine here, but maybe user wants extra safety?
	// Actually, looking at the code I read:
	// const [showMaintenance, setShowMaintenance] = useState(false);
	// It defaults to false. It is only set to true in `handleViewStore` line 65.
	// So if it's "still showing even after complete", maybe the user is clicking "View Store"?
	// OR maybe there is another component using it?
	// The grep search only showed Topbar.
	// Wait, the user said "modal is still show even after i have completed all the steps".
	// If they *click* view store and it's compliant, it should open the link.
	// If it's NOT compliant, it shows maintenance.
	// If the user says "I completed steps", then `isComplete` should be true.
	// If `isComplete` is true, then `handleViewStore` runs window.open and DOES NOT set showMaintenance(true).

	// So if the modal opens, it means `isComplete` is FALSE.
	// I need to debug why `isComplete` is false despite user doing steps.
	// Ah, `useBrandOnboardingStatus` logic might be failing.

	// Let's first ensure the modal logic here is indeed clean. It looks fine.
	// The issue is likely in `useBrandOnboardingStatus` calculation.

	// But wait, the user showed a screenshot where the progress bar IS full/high.
	// Let's look at `useBrandOnboardingStatus.ts` again.

	const handleViewStore = () => {
		if (activeRole !== "brand") return;

		if (isComplete) {
			const username = roleDetection?.brandUsername;
			const slug = roleDetection?.brandSlug || username; // prefer slug for domain
			const isPro = roleDetection?.brandSubscriptionTier === "pro";

			if (isPro && slug) {
				// Pro Plan: https://brandslug.labeld.app
				window.open(`https://${slug}.labeld.app`, "_blank");
			} else if (!isPro && username) {
				// Free Plan: https://shop.labeld.app/username
				window.open(`https://shop.labeld.app/${username}`, "_blank");
			}
		} else {
			setShowMaintenance(true);
		}
	};

	// Determine what to show based on actual available data
	const hasBrand = roleDetection?.hasBrandProfile;
	const hasOrganizer = roleDetection?.hasEventOrganizerProfile;

	// Name to display - prioritize based on active role and available data
	let displayName = "My Account";
	let accountTypeLabel = "User Profile";
	let logoUrl: string | null = null;

	if (hasBrand && hasOrganizer) {
		accountTypeLabel = "Brand & Event Account";
		// Prefer brand logo if active is brand, else organizer, else brand
		if (activeRole === "brand") {
			displayName = roleDetection?.brandName || "Brand";
			logoUrl = roleDetection?.brandLogoUrl || null;
		} else {
			displayName = roleDetection?.organizerName || "Organizer";
			logoUrl = roleDetection?.organizerLogoUrl || null;
		}
	} else if (activeRole === "brand" && hasBrand) {
		displayName = roleDetection?.brandName || "Brand";
		accountTypeLabel = "Brand Account";
		logoUrl = roleDetection?.brandLogoUrl || null;
	} else if (activeRole === "eventOrganizer" && hasOrganizer) {
		displayName = roleDetection?.organizerName || "Organizer";
		accountTypeLabel = "Event Organizer";
		logoUrl = roleDetection?.organizerLogoUrl || null;
	} else if (hasOrganizer && !hasBrand) {
		// User only has organizer account
		displayName = roleDetection?.organizerName || "Organizer";
		accountTypeLabel = "Event Organizer";
		logoUrl = roleDetection?.organizerLogoUrl || null;
	} else if (hasBrand && !hasOrganizer) {
		// User only has brand account
		displayName = roleDetection?.brandName || "Brand";
		accountTypeLabel = "Brand Account";
		logoUrl = roleDetection?.brandLogoUrl || null;
	}

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const { signOutApp } = useAuth(); // Create method for logout if not extracted already

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest(".profile-dropdown-container")) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<>
			<div className="h-16 sm:h-18 flex items-center gap-3 px-4 sm:px-6 lg:px-8 border-b border-stroke bg-bg/50 backdrop-blur-xl sticky top-0 z-40">
				{/* Mobile Menu Button */}
				<div className="flex items-center lg:hidden">
					<button
						onClick={onMenuClick}
						className="p-2 -ml-2 text-text hover:bg-surface rounded-lg transition-colors"
					>
						<Menu className="w-6 h-6" />
					</button>
				</div>

				{/* Mobile Logo (only when menu is present) */}
				<div className="flex lg:hidden items-center gap-2">
					<Image
						src="/1.svg"
						alt="Labeld"
						width={32}
						height={32}
						className="h-8 w-8"
					/>
				</div>

				<div className="flex-1"></div>

				{/* Right Actions */}
				<div className="flex items-center gap-3 sm:gap-4">
					{/* View Store Button (Brand Only) */}
					{activeRole === "brand" && (
						<button
							onClick={handleViewStore}
							className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-stroke hover:bg-surface hover:border-accent/50 transition-all group"
						>
							<span className="text-sm font-medium text-text group-hover:text-accent transition-colors">
								View Store
							</span>
							<Eye className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
						</button>
					)}

					<div className="h-8 w-[1px] bg-stroke hidden sm:block"></div>

					{/* Profile Section */}
					<div className="relative profile-dropdown-container">
						<button
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className="flex items-center gap-3 hover:bg-surface rounded-full pr-2 transition-colors outline-none"
						>
							<div className="flex flex-col items-end hidden sm:flex">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-text">
										{displayName}
									</span>
									{/* Plan Badge (Brand Only) */}
									{hasBrand &&
									roleDetection?.brandSubscriptionTier === "pro" ? (
										<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20">
											PRO
										</span>
									) : hasBrand ? (
										<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stroke text-text-muted text-xs font-medium border border-stroke">
											FREE
										</span>
									) : null}
								</div>
								<span className="text-xs text-text-muted">
									{accountTypeLabel}
								</span>
							</div>

							<div className="h-9 w-9 rounded-full overflow-hidden border border-stroke ring-2 ring-transparent hover:ring-accent/20 transition-all cursor-pointer">
								{loading ? (
									<div className="h-full w-full bg-stroke animate-pulse" />
								) : logoUrl ? (
									<Image
										src={logoUrl}
										alt={displayName}
										width={36}
										height={36}
										className="object-cover h-full w-full"
									/>
								) : profileImageUrl ? (
									<Image
										src={profileImageUrl}
										alt="Profile"
										width={36}
										height={36}
										className="object-cover h-full w-full"
									/>
								) : (
									<Image
										src="/images/profile-hero.JPG"
										alt="Profile"
										width={36}
										height={36}
										className="object-cover h-full w-full"
									/>
								)}
							</div>
						</button>

						{/* Dropdown Menu */}
						{isDropdownOpen && (
							<div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-stroke bg-surface shadow-xl shadow-black/5 animate-in fade-in slide-in-from-top-2 z-50 overflow-hidden">
								<div className="p-1">
									{hasBrand && (
										<button
											onClick={() => {
												setIsDropdownOpen(false);
												router.push("/brand-space/profile/edit");
											}}
											className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text hover:bg-bg transition-colors"
										>
											<div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
												B
											</div>
											<div className="flex flex-col items-start">
												<span className="font-medium">Brand Profile</span>
												<span className="text-[10px] text-text-muted">
													Edit details
												</span>
											</div>
										</button>
									)}

									{hasOrganizer && (
										<button
											onClick={() => {
												setIsDropdownOpen(false);
												router.push("/organizer-space/edit");
											}}
											className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text hover:bg-bg transition-colors"
										>
											<div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
												E
											</div>
											<div className="flex flex-col items-start">
												<span className="font-medium">Organizer Profile</span>
												<span className="text-[10px] text-text-muted">
													Edit details
												</span>
											</div>
										</button>
									)}
								</div>

								<div className="h-[1px] bg-stroke mx-1"></div>

								<div className="p-1">
									<button
										onClick={() => {
											setIsDropdownOpen(false);
											signOutApp();
										}}
										className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/5 transition-colors"
									>
										<div className="h-8 w-8 flex items-center justify-center">
											<ExternalLink className="w-4 h-4 rotate-180" />
										</div>
										<span className="font-medium">Log out</span>
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			<MaintenanceModal
				isOpen={showMaintenance}
				onClose={() => setShowMaintenance(false)}
			/>
		</>
	);
}
