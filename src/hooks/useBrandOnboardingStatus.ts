import { useState, useEffect } from "react";
import { useWallet } from "./useWallet";
import { useBrandSpace } from "./useBrandSpace";
import { useDashboardContext } from "./useDashboardContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { useAuth } from "@/lib/auth/AuthContext";

export type OnboardingStepId = "bank" | "profile" | "shipping" | "product";

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
	isComplete: boolean;
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

	const [shippingConfigured, setShippingConfigured] = useState(false);
	const [shippingLoading, setShippingLoading] = useState(true);

	// Fetch shipping settings
	useEffect(() => {
		if (!user?.uid) {
			setShippingLoading(false);
			return;
		}

		async function checkShipping() {
			try {
				const settingsRef = doc(db, "users", user!.uid, "shippingRules", "settings");
				const snap = await getDoc(settingsRef);
				// Consider configured if doc exists and mode is set (defaults are usually set on creation, but let's check existence)
				setShippingConfigured(snap.exists());
			} catch (e) {
				console.error("Failed to check shipping settings", e);
			} finally {
				setShippingLoading(false);
			}
		}

		checkShipping();
	}, [user?.uid]);

	if (!user) {
		return {
			steps: [],
			percentage: 0,
			isComplete: false,
			loading: true,
		};
	}

	const brand = roleDetection; // contains brandName, phoneNumber etc.

	// 1. Bank Account
	const isBankComplete = !!walletData.summary?.payout?.bank?.isVerified;

	// 2. Profile / Brand Details (Name + Phone)
    // We check if brandName exists (basics) and user has phoneNumber
    const hasBrandDoc = !!brand?.brandName;
	const isProfileComplete = !!(hasBrandDoc && brand?.phoneNumber);

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
			isComplete: isShippingComplete,
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
	];

	const completedCount = steps.filter((s) => s.isComplete).length;
    // Cap at 100
	const percentage = Math.round((completedCount / steps.length) * 100);
	const isComplete = completedCount === steps.length;
    
    // Global loading state
	const loading = walletLoading || brandSpaceLoading || shippingLoading;

	return {
		steps,
		percentage,
		isComplete,
		loading,
	};
}
