import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "./useWallet";
import { useBrandSpace } from "./useBrandSpace";
import { useDashboardContext } from "./useDashboardContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { useAuth } from "@/lib/auth/AuthContext";

export type OnboardingStepId =
	| "bank"
	| "profile"
	| "shipping"
	| "product"
	| "website";

export interface OnboardingStep {
	id: OnboardingStepId;
	title: string;
	description: string;
	isComplete: boolean;
	cta: string;
	href: string;
    actionType?: "link" | "modal"; // For triggering modals vs navigation
}

export interface BrandOnboardingStatus {
	steps: OnboardingStep[];
	percentage: number;
	/** Every checklist step is done (drives the checklist card and progress). */
	isComplete: boolean;
	/**
	 * The store is ready to be shared: everything except the website step.
	 * "View store" gates on this, so adding the website step to the checklist
	 * doesn't suddenly lock brands out of opening a store they already run.
	 */
	canViewStore: boolean;
	loading: boolean;
}

export function useBrandOnboardingStatus(): BrandOnboardingStatus {
	const { user } = useAuth();
	const { roleDetection } = useDashboardContext();
	const { walletData, loading: walletLoading } = useWallet();
	
    // We use useBrandSpace primarily for product count. 
    // Optimization: we could just use a count query if useBrandSpace is too heavy, 
    // but it's likely already cached/loaded in the dashboard.
	const { data: brandSpaceData, loading: brandSpaceLoading } = useBrandSpace({
		range: "today", // range doesn't matter for total pieces count usually, but strict typing requires it
	});

	// Fetch shipping settings with cache
	const { data: shippingConfigured, isLoading: shippingLoading } = useQuery({
		queryKey: ["shippingSettings", user?.uid],
		queryFn: async () => {
			if (!user?.uid) return false;
			const settingsRef = doc(db, "users", user.uid, "shippingRules", "settings");
			const snap = await getDoc(settingsRef);
			return snap.exists();
		},
		enabled: !!user?.uid,
		staleTime: 1000 * 60 * 5, // 5 minutes cache
	});

	if (!user) {
		return {
			steps: [],
			percentage: 0,
			isComplete: false,
			canViewStore: false,
			loading: true,
		};
	}

	const brand = roleDetection; // contains brandName, phoneNumber etc.

	// 1. Bank Account
	const isBankComplete = !!walletData.summary?.payout?.bank?.isVerified;

	// 2. Profile / Brand Details (Name + Phone)
    // We check if brandName exists (basics) and user has phoneNumber
    const hasBrandDoc = !!brand?.brandName;
	// Phone is saved on both brands/{uid} and users/{uid} by the web profile
	// editor, but mobile only writes/reads the user doc. Accept either so a brand
	// set up on one platform isn't shown as incomplete on the other.
	const hasPhone = !!(brand?.phoneNumber?.trim() || brand?.userPhoneNumber?.trim());
	const isProfileComplete = hasBrandDoc && hasPhone;

	// 3. Shipping
	const isShippingComplete = shippingConfigured;

	// 4. Product
    // Check if at least one product exists
	const isProductComplete = (brandSpaceData?.kpis?.piecesCount || 0) > 0;

	const steps: OnboardingStep[] = [
		{
			id: "bank",
			title: "Add bank details to receive payments",
			description: "This will allow you to start collecting payments on your website.",
			isComplete: isBankComplete,
			cta: "Add Bank Details",
			href: "/wallet", 
		},
		{
			id: "profile",
			title: hasBrandDoc ? "Add Phone Number" : "Create your store",
			description: hasBrandDoc 
                ? "Update your profile with a phone number to complete setup" 
                : "Set up your brand identity and profile to get started",
			isComplete: isProfileComplete,
			cta: hasBrandDoc ? "Update Profile" : "Setup Brand",
			href: hasBrandDoc ? "/brand-space/profile/edit" : "/brand-space/setup", 
		},
		{
			id: "shipping",
			title: "Add shipping prices on your website",
			description: "Add shipping prices on your website for your customers to checkout",
			isComplete: !!shippingConfigured,
			cta: "Configure Shipping",
			href: "/settings?section=shipping", // Updated route
		},
		{
			id: "product",
			title: "Add products to your store",
			description: "You can always add more products later from the Products page in the side menu",
			isComplete: isProductComplete,
			cta: "Add Product",
			href: hasBrandDoc ? "/pieces/new" : "/brand-space/setup", // Redirect to setup if no brand doc
		},
		{
			id: "website",
			title: "Set up your website",
			description: "Activate and customize your branded storefront.",
			isComplete: !!brand?.storefrontActivated,
			cta: "Set Up Website",
			href: "/brand-space/site-customization",
		},
	];

	const completedCount = steps.filter((s) => s.isComplete).length;
    // Cap at 100
	const percentage = Math.round((completedCount / steps.length) * 100);
	const isComplete = completedCount === steps.length;
	const canViewStore = steps
		.filter((s) => s.id !== "website")
		.every((s) => s.isComplete);

    // Global loading state
	const loading = walletLoading || brandSpaceLoading || shippingLoading;

	return {
		steps,
		percentage,
		isComplete,
		canViewStore,
		loading,
	};
}
