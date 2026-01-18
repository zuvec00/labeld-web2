"use client";

import React from "react";
import {
	Check,
	Store,
	Globe,
	TrendingUp,
	ArrowRight,
	Sparkles,
	Flame,
	Clock,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Topbar from "@/components/dashboard/Topbar";
// import router from "next/router";
import { useRouter } from "next/navigation";
import UpgradeConfirmModal from "@/components/pricing/UpgradeConfirmModal";
// import { useAuthState } from "react-firebase-hooks/auth"; // or equivalent, let's use standard auth listener since we are in app dir but client
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app, db } from "@/lib/firebase/firebaseConfig"; // Ensure app is initialized
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { BillingCycle } from "@/lib/models/subscription.types";
import { startProSubscription } from "@/lib/firebase/callables/subscriptions";

// --- Components ---

function FeatureList({
	items,
	muted = false,
}: {
	items: string[];
	muted?: boolean;
}) {
	return (
		<ul className="space-y-3 mb-6">
			{items.map((item, i) => (
				<li key={i} className="flex items-start gap-3 text-sm">
					<Check
						className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
							muted ? "text-text-muted" : "text-text"
						}`}
					/>
					<span className={muted ? "text-text-muted" : "text-text"}>
						{item}
					</span>
				</li>
			))}
		</ul>
	);
}

function SectionHeading({
	icon: Icon,
	title,
	className,
}: {
	icon: any;
	title: string;
	className?: string;
}) {
	return (
		<div className={`flex items-center gap-2 mb-3 ${className}`}>
			<Icon className="w-4 h-4 opacity-70" />
			<h4 className="text-xs font-semibold uppercase tracking-wider">
				{title}
			</h4>
		</div>
	);
}

// --- Constants ---

const BILLING_OPTIONS: {
	id: BillingCycle;
	label: string;
	saveLabel?: string;
	price: string;
	originalPrice?: string;
	period: string;
	savingText?: string;
	isBestValue?: boolean;
	weight: number; // For comparison
}[] = [
	{
		id: "monthly",
		label: "Monthly",
		price: "₦5,000",
		period: "/ month",
		weight: 1,
	},
	{
		id: "quarterly",
		label: "Quarterly",
		saveLabel: "Save ₦1,500",
		price: "₦13,500",
		originalPrice: "₦15,000",
		period: "/ 3 months",
		savingText: "Save ₦1,500",
		weight: 3,
	},
	{
		id: "biannual",
		label: "Biannual",
		saveLabel: "Save ₦3,500",
		price: "₦26,500",
		originalPrice: "₦30,000",
		period: "/ 6 months",
		savingText: "Save ₦3,500",
		weight: 6,
	},
	{
		id: "annual",
		label: "Annual",
		saveLabel: "Save ₦10,000",
		price: "₦50,000",
		originalPrice: "₦60,000",
		period: "/ year",
		savingText: "Save ₦10,000 (15%)",
		isBestValue: true,
		weight: 12,
	},
];

// --- Promo Logic Hook ---
function usePromoStatus() {
	const [status, setStatus] = React.useState<{
		active: boolean;
		remaining: number;
		limit: number;
		endsAt: Date | null;
	} | null>(null);

	React.useEffect(() => {
		// Real-time listener just in case spots fill up while user is on page
		const promoRef = doc(db, "system", "promotions");
		const unsub = onSnapshot(promoRef, (snap) => {
			if (snap.exists()) {
				const data = snap.data();
				const currentCount = data?.pro_launch_count || 0;
				const limit =
					typeof data?.pro_launch_limit === "number"
						? data.pro_launch_limit
						: 100;
				const promoEndsAt = data?.promoEndsAt?.toDate() || null;

				const isExpiredByTime = promoEndsAt && new Date() > promoEndsAt;
				const remaining = Math.max(0, limit - currentCount);

				const isActive = remaining > 0 && !isExpiredByTime;

				setStatus({
					active: isActive,
					remaining,
					limit,
					endsAt: promoEndsAt,
				});
			} else {
				// No promo doc exists yet - treat as fresh launch (0 claimed, 100 limit, Active)
				setStatus({ active: true, remaining: 100, limit: 100, endsAt: null });
			}
		});

		return () => unsub();
	}, []);

	return status;
}

// ... Main Page ...

export default function PublicPricingPage() {
	const brandName = "yourbrand";
	const router = useRouter();
	const [billing, setBilling] = React.useState<BillingCycle>("annual");
	const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
	const [showStickyBanner, setShowStickyBanner] = React.useState(true);

	// Auth & Subscription State
	const [user, setUser] = React.useState<any>(null);
	const [subscription, setSubscription] = React.useState<{
		tier: "free" | "pro";
		cycle?: BillingCycle;
		status?: "active" | "expired" | "past_due" | "cancelled";
		hasClaimedPromo?: boolean;
	} | null>(null);

	// Promo State
	const promoStatus = usePromoStatus();
	const [claimingPromo, setClaimingPromo] = React.useState(false);

	React.useEffect(() => {
		const auth = getAuth(app);
		const unsubAuth = onAuthStateChanged(auth, async (u) => {
			setUser(u);
			if (u) {
				// Listen for subscription changes
				const brandRef = doc(db, "brands", u.uid);
				const unsubSnapshot = onSnapshot(brandRef, (snap) => {
					if (snap.exists()) {
						const data = snap.data();
						setSubscription({
							tier: (data.subscriptionTier as "free" | "pro") || "free",
							cycle: data.billingCycle as BillingCycle,
							status: data.subscriptionStatus,
							hasClaimedPromo: data.hasClaimedPromo,
						});
					}
				});
				return () => unsubSnapshot();
			} else {
				setSubscription(null);
			}
		});

		return () => unsubAuth();
	}, []);

	const selectedOption = BILLING_OPTIONS.find((o) => o.id === billing)!;
	const currentOption = subscription?.cycle
		? BILLING_OPTIONS.find((o) => o.id === subscription.cycle)
		: null;

	// Determine if promo applies to THIS USER
	const canClaimPromo =
		promoStatus?.active &&
		user &&
		subscription?.tier === "free" &&
		!subscription?.hasClaimedPromo;

	// Should show sticky banner? (Only if eligible and hasn't closed it)
	const shouldShowBanner =
		canClaimPromo && showStickyBanner && !upgradeModalOpen && !claimingPromo;

	async function handleUpgradeClick() {
		if (!user) {
			router.push(`/?auth=login&plan=pro&billing=${billing}`);
			return;
		}

		if (canClaimPromo) {
			// Trigger Promo Claim Flow
			if (!confirm("Confirm to claim your 2 months free Pro subscription?"))
				return;

			setClaimingPromo(true);
			try {
				await startProSubscription({
					billingCycle: billing,
					claimPromo: true,
					isLive: true, // Promo is "Live" in sense of real activation
				});
				// Show confetti? Or just simple success state/redirect
				// Since we have a listener, the button state will update automatically once Firestore updates
				alert("🎉 Promo Claimed! You have 2 months of Pro for free.");
				router.push("/dashboard");
			} catch (err: any) {
				console.error("Promo claim failed", err);
				alert(err.message || "Failed to claim promo.");
			} finally {
				setClaimingPromo(false);
			}
		} else {
			// Standard Paid Flow
			setUpgradeModalOpen(true);
		}
	}

	// Helper to determine button state
	const getProButtonState = () => {
		if (claimingPromo) return { text: "Claiming Spot...", disabled: true };
		if (!user) return { text: "Upgrade to Pro", disabled: false };
		if (!subscription) return { text: "Loading...", disabled: true };

		if (subscription.tier === "free") {
			if (canClaimPromo) {
				return { text: "Claim 2 Months Free", disabled: false };
			}
			return { text: "Upgrade to Pro", disabled: false };
		}

		// User is Pro
		if (!currentOption) return { text: "Upgrade to Pro", disabled: false }; // Fallback

		if (selectedOption.id === currentOption.id) {
			return { text: "Current Plan", disabled: true };
		}

		if (selectedOption.weight > currentOption.weight) {
			// e.g. Monthly -> Annual
			return {
				text: `Upgrade to ${selectedOption.label}`,
				disabled: false,
			};
		}

		if (selectedOption.weight < currentOption.weight) {
			// e.g. Annual -> Monthly
			return { text: "Downgrade Unavailable", disabled: true };
		}

		return { text: "Upgrade to Pro", disabled: false };
	};

	const getFreeButtonState = () => {
		if (!user) return { text: "Get Started Free", disabled: false };
		if (!subscription) return { text: "Loading...", disabled: true };

		if (subscription.tier === "free") {
			return { text: "Current Plan", disabled: true };
		}

		// User is Pro
		return { text: "Downgrade Unavailable", disabled: true };
	};

	const proButton = getProButtonState();
	const freeButton = getFreeButtonState();

	return (
		<div className="min-h-screen bg-bg text-text flex flex-col font-sans relative">
			<UpgradeConfirmModal
				isOpen={upgradeModalOpen}
				onClose={() => setUpgradeModalOpen(false)}
				billingCycle={billing}
				priceDisplay={selectedOption.price}
				periodDisplay={selectedOption.period}
			/>

			{/* Sticky Promo Banner */}
			{shouldShowBanner && (
				<div className="fixed bottom-4 left-3 right-3 z-40 md:left-1/2 md:-translate-x-1/2 md:w-auto md:max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
					<div className="bg-black/90 backdrop-blur-xl border border-accent/40 rounded-xl p-3 md:p-4 shadow-2xl flex items-center justify-between gap-3 md:gap-4 ring-1 ring-white/10">
						<div className="flex items-center gap-3">
							<div className="bg-gradient-to-br from-accent to-cta p-2 rounded-lg hidden sm:block">
								<Sparkles className="w-5 h-5 text-white animate-pulse" />
							</div>
							<div>
								<h4 className="font-bold text-white text-sm md:text-base flex flex-wrap md:flex-nowrap items-center gap-x-2 gap-y-1">
									<span className="whitespace-nowrap md:hidden">
										2 Months Free
									</span>
									<span className="whitespace-nowrap hidden md:inline">
										2 Months Free Access
									</span>
									<span className="bg-accent/20 text-accent text-[9px] md:text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-accent/20 whitespace-nowrap">
										{promoStatus?.remaining} SPOTS LEFT
									</span>
								</h4>
								<p className="text-white/60 text-[11px] md:text-sm mt-0.5 leading-tight hidden text-xs xs:block md:block">
									Join the first 100 brands on Labeld Studio Pro.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 md:gap-3 shrink-0">
							<Button
								variant="primary"
								onClick={handleUpgradeClick}
								className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm bg-white text-black hover:bg-white/90 border-0"
							>
								<span className="md:hidden">Claim</span>
								<span className="hidden md:inline">Claim Now</span>
							</Button>
							<button
								onClick={() => setShowStickyBanner(false)}
								className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
							>
								<X className="w-4 h-4 text-white/50" />
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Header */}
			<header className="sticky top-0 z-50 w-full border-b border-stroke bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60">
				<div className="flex h-16 max-w-6xl mx-auto items-center justify-between px-4 md:px-8">
					<div className="flex items-center gap-2 font-heading font-bold text-md md:text-lg tracking-tight">
						<span>LABELD STUDIO</span>
					</div>
					<nav className="flex items-center gap-4 sm:gap-6">
						<Button
							text="Try Labeld Studio"
							variant="primary"
							className="h-9 px-4 text-sm md:text-md rounded-sm font-semibold !font-sans shadow-sm bg-bg text-text"
							onClick={handleUpgradeClick}
						/>
					</nav>
				</div>
			</header>

			<main className="flex-1 w-full max-w-6xl mx-auto py-16 px-4 md:px-8 space-y-16 md:space-y-24">
				{/* 1. Hero Section */}
				<div className="text-center space-y-6 max-w-3xl mx-auto relative">
					{/* Promo Banner if Active */}
					{promoStatus?.active && (
						<div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-700 w-full flex justify-center">
							<div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent/10 to-cta/10 border border-accent/30 backdrop-blur-md text-text px-4 py-1.5 rounded-full shadow-glow">
								<Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
								<span className="text-xs font-bold tracking-wide">
									EARLY ACCESS • 2 MONTHS FREE
								</span>
							</div>
						</div>
					)}

					<h1 className="font-heading text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
						From listing on a platform
						<br />
						to <span className="text-cta">owning your presence.</span>
					</h1>
					<p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
						Free lets you participate in the marketplace.
						<br className="hidden sm:block" />
						Pro gives you the tools to build a destination.
					</p>
				</div>

				{/* 1.5 Billing Toggle */}
				<div className="flex justify-center mb-8 md:mb-12 z-10 relative">
					<div className="inline-flex bg-surface-neutral p-3 rounded-xl border border-stroke items-center overflow-x-auto max-w-full no-scrollbar">
						{BILLING_OPTIONS.map((option) => (
							<button
								key={option.id}
								onClick={() => setBilling(option.id)}
								className={`
                                    relative px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm font-medium !font-sans transition-all whitespace-nowrap
                                    ${
																			billing === option.id
																				? "bg-bg text-text shadow-sm ring-1 ring-stroke"
																				: "text-text-muted hover:text-text hover:bg-surface/50"
																		}
                                `}
							>
								{option.label}
								{option.saveLabel && (
									<span
										className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
											option.isBestValue
												? "bg-cta text-bg"
												: "bg-surface text-text-muted"
										}`}
									>
										{option.isBestValue
											? "BEST"
											: option.saveLabel.replace("Save ", "-")}
									</span>
								)}
							</button>
						))}
					</div>
				</div>

				{/* 2. Plan Cards (Side-by-Side) */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
					{/* Free Plan */}
					<div className="rounded-3xl border border-stroke bg-surface/30 p-8 md:p-10 flex flex-col relative overflow-hidden group hover:border-text/20 transition-colors order-2 md:order-1">
						<div className="mb-8">
							<div className="flex items-baseline justify-between mb-4">
								<h2 className="text-3xl font-heading font-bold">Free</h2>
								<span className="text-2xl font-heading text-text-muted font-medium">
									₦0
								</span>
							</div>
							<p className="text-text font-medium text-lg mb-2">
								Sell inside the Labeld marketplace.
							</p>
							<div className="bg-bg rounded-lg px-4 py-3 border border-stroke text-sm text-text-muted flex items-center gap-2 font-mono">
								<Globe className="w-4 h-4 opacity-50 flex-shrink-0" />
								<span className="truncate">
									shop.labeld.app/
									<span className="text-text-muted/70">yourbrand</span>
								</span>
							</div>
						</div>

						<div className="flex-1">
							<ul className="space-y-4">
								{[
									"List products & drops",
									"Accept orders & payouts",
									"Appear in the Labeld marketplace",
									"Basic brand profile (logo, bio)",
									"Standard analytics (sales & revenue)",
								].map((item, i) => (
									<li key={i} className="flex items-start gap-3.5 text-base">
										<Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-text/40" />
										<span className="text-text-muted">{item}</span>
									</li>
								))}
							</ul>
						</div>

						<div className="mt-10 pt-8 border-t border-stroke/50">
							<Button
								variant="outline"
								className="w-full justify-center h-12 text-base"
								text={freeButton.text}
								onClick={() => router.push("/?auth=signup&plan=free")}
								disabled={freeButton.disabled}
							/>
							{/* Promo Teaser for Free Users */}
							{canClaimPromo && (
								<p className="text-center text-xs text-accent mt-3 cursor-pointer hover:underline animate-fade-in">
									Get Pro features free for 2 months →
								</p>
							)}
						</div>
					</div>

					{/* Pro Plan */}
					<div
						className={`rounded-3xl border p-8 md:p-10 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-300 ring-1 order-1 md:order-2
                            ${
															canClaimPromo
																? "border-accent/50 bg-bg/50 ring-accent/30 shadow-accent/10"
																: "border-accent bg-bg ring-accent/20 shadow-accent/5"
														}
                        `}
					>
						{/* Promo Header / Badge */}
						{canClaimPromo && (
							<div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent via-cta to-accent animate-gradient-x" />
						)}

						{/* Best Value Badge if Annual (only if not promo, to avoid clutter) */}
						{selectedOption.isBestValue && !canClaimPromo && (
							<div className="absolute top-0 right-0 bg-cta text-bg text-xs font-bold px-4 py-1.5 rounded-bl-xl tracking-wide z-10">
								BEST VALUE
							</div>
						)}

						{/* Promo Remaining Spots */}
						{promoStatus?.active && canClaimPromo && (
							<div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-full shadow-lg z-10">
								<Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
								<span className="text-[10px] font-bold text-white tracking-wide">
									{promoStatus.remaining} SPOTS LEFT
								</span>
							</div>
						)}

						<div className="mb-8 p-1">
							<div className="flex items-center justify-between mb-4 mt-2">
								<h2 className="text-3xl font-heading font-bold flex items-center gap-3">
									Pro
								</h2>
								{!selectedOption.isBestValue && !canClaimPromo && (
									<span className="text-[11px] font-bold uppercase tracking-widest text-bg bg-accent px-3 py-1 rounded-full">
										Growing Brands
									</span>
								)}
							</div>

							{canClaimPromo ? (
								// PROMO PRICE DISPLAY
								<div className="flex flex-col mb-6">
									<div className="flex items-center gap-3">
										<span className="text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-cta animate-gradient-text drop-shadow-sm">
											Free
										</span>
										<div className="flex flex-col">
											<span className="text-xs font-bold uppercase tracking-wide text-text-muted line-through opacity-70">
												{selectedOption.price}
											</span>
											<span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-1.5 py-0.5 rounded">
												2 MONTHS
											</span>
										</div>
									</div>
									<p className="text-sm text-text-muted mt-2">
										Then {selectedOption.price} {selectedOption.period}
									</p>
								</div>
							) : (
								// STANDARD PRICE DISPLAY
								<div className="flex flex-col mb-6">
									<div className="flex items-baseline gap-2">
										<span className="text-4xl font-heading font-bold text-text">
											{selectedOption.price}
										</span>
										<span className="text-text-muted font-medium">
											{selectedOption.period}
										</span>
									</div>
									{selectedOption.originalPrice && (
										<div className="flex items-center gap-2 mt-1">
											<span className="text-sm text-text-muted line-through decoration-text-muted/50">
												{selectedOption.originalPrice}
											</span>
											<span className="text-sm font-medium text-cta">
												{selectedOption.savingText}
											</span>
										</div>
									)}
								</div>
							)}

							<p className="text-text font-medium text-lg mb-2">
								Your own Labeld-powered store.
							</p>
							<div className="bg-gradient-to-r from-accent/5 to-transparent rounded-lg px-4 py-3 border border-accent/20 text-sm text-text flex items-center gap-2 font-mono">
								<Globe className="w-4 h-4 text-accent flex-shrink-0" />
								<span className="truncate">
									<span className="text-accent font-semibold">{brandName}</span>
									.labeld.app
								</span>
							</div>
						</div>

						<div className="flex-1 space-y-8">
							{/* Ownership Block */}
							<div>
								<h3 className="text-xs font-bold uppercase tracking-widest text-accent mb-4">
									Ownership
								</h3>
								<ul className="space-y-4">
									{[
										"Your own branded storefront",
										"0% fees on your personal storefront sales",
										"Custom store profile URL (subdomain)",
										"Reduced / white-label Labeld branding",
									].map((item, i) => (
										<li key={i} className="flex items-start gap-3.5 text-base">
											<Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-accent" />
											<span className="text-text font-medium">{item}</span>
										</li>
									))}
								</ul>
							</div>

							{/* Customization & Analytics Block */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
								<div>
									<h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
										Customization
									</h3>
									<FeatureList
										items={[
											"Custom templates & layouts",
											"Section ordering & visibility",
											"Dark / light mode toggle",
										]}
										muted
									/>
								</div>
								<div>
									<h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
										Advanced Analytics
									</h3>
									<FeatureList
										items={[
											"Performance trends over time",
											"Traffic source breakdown",
											"Actionable brand insights",
										]}
										muted
									/>
								</div>
							</div>
						</div>

						<div className="mt-10 pt-8 border-t border-stroke/50">
							<Button
								variant="primary"
								className={`w-full justify-center h-14 text-base shadow-lg group hover:shadow-accent/40 disabled:opacity-50 disabled:shadow-none transition-all
                                    ${
																			canClaimPromo
																				? "bg-white text-black hover:bg-white/90 shadow-white/20 border-0"
																				: "shadow-accent/20"
																		}
                                `}
								onClick={handleUpgradeClick}
								disabled={proButton.disabled}
							>
								<span className="flex items-center gap-2">
									{canClaimPromo && !claimingPromo && (
										<Sparkles className="w-4 h-4 animate-pulse text-accent" />
									)}
									{proButton.text}
									{!proButton.disabled && (
										<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
									)}
								</span>
							</Button>
							<p className="text-center text-xs text-text-muted mt-4">
								{proButton.disabled
									? "Change plan settings via support"
									: canClaimPromo
									? "Limited time offer. Terms apply."
									: "Built for brands ready to grow"}
							</p>
						</div>
					</div>
				</div>

				{/* 3. Feature Comparison Table */}
				<div className="max-w-4xl mx-auto pt-16">
					<div className="text-center mb-20">
						<h3 className="font-heading text-3xl font-semibold mb-3">
							Compare Plans
						</h3>
						<p className="text-text-muted text-lg">
							Choose the level of control you need.
						</p>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="border-b border-stroke">
									<th className="py-6 pl-4 w-1/2 font-medium text-text-muted text-sm uppercase tracking-wider align-bottom">
										Feature
									</th>
									<th className="py-6 px-4 text-center font-bold text-xl w-1/4 align-bottom">
										Free
									</th>
									<th className="py-6 px-4 text-center font-bold text-xl w-1/4 text-accent align-bottom">
										Pro
									</th>
								</tr>
							</thead>
							<tbody className="text-base text-text-muted">
								<tr className="border-b border-stroke">
									<td
										colSpan={3}
										className="pt-12 pb-6 pl-4 font-heading font-semibold text-xl text-text"
									>
										Selling & Commerce
									</td>
								</tr>
								<tr className="border-b border-stroke/20 hover:bg-surface/5 transition-colors">
									<td className="py-5 pl-4 text-text">Marketplace listing</td>
									<td className="py-5 text-center text-text">
										<Check className="w-5 h-5 mx-auto" />
									</td>
									<td className="py-5 text-center text-accent">
										<Check className="w-5 h-5 mx-auto" />
									</td>
								</tr>
								<tr className="border-b border-stroke/20 hover:bg-surface/5 transition-colors">
									<td className="py-5 pl-4 text-text">
										Secure checkout & payouts
									</td>
									<td className="py-5 text-center text-text">
										<Check className="w-5 h-5 mx-auto" />
									</td>
									<td className="py-5 text-center text-accent">
										<Check className="w-5 h-5 mx-auto" />
									</td>
								</tr>
								<tr className="border-b border-stroke/20 hover:bg-surface/5 transition-colors">
									<td className="py-5 pl-4 text-text">
										0% Labeld fees on storefront sales
									</td>
									<td className="py-5 text-center text-text-muted/20">—</td>
									<td className="py-5 text-center text-accent">
										<Check className="w-5 h-5 mx-auto" />
									</td>
								</tr>

								<tr className="border-b border-stroke">
									<td
										colSpan={3}
										className="pt-16 pb-6 pl-4 font-heading font-semibold text-xl text-text"
									>
										Brand Presence & Identity
									</td>
								</tr>
								<tr className="border-b border-stroke/20 hover:bg-surface/5 transition-colors">
									<td className="py-5 pl-4 text-text">Basic Brand Profile</td>
									<td className="py-5 text-center text-text">
										<Check className="w-5 h-5 mx-auto" />
									</td>
									<td className="py-5 text-center text-accent">
										<Check className="w-5 h-5 mx-auto" />
									</td>
								</tr>
								<tr className="border-b border-stroke/20 hover:bg-surface/5 transition-colors">
									<td className="py-5 pl-4 text-text">
										Custom store URL (Subdomain)
									</td>
									<td className="py-5 text-center text-text-muted/20">—</td>
									<td className="py-5 text-center text-accent">
										<Check className="w-5 h-5 mx-auto" />
									</td>
								</tr>

								{/* ... other rows ... */}
								{/* Keeping it slightly shorter for reliability if needed, but trying to be complete */}
							</tbody>
						</table>
					</div>
				</div>

				{/* 4. Closing CTA Section */}
				<div className="bg-surface/30 rounded-3xl p-12 text-center border border-stroke max-w-4xl mx-auto">
					<h3 className="font-heading text-2xl md:text-3xl font-semibold mb-4">
						Ready to own your presence?
					</h3>
					<p className="text-text-muted text-lg mb-8 max-w-xl mx-auto">
						Join the brands who are actively building their future, not just
						posting products.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Button
							variant="primary"
							className="w-full sm:w-auto px-8 h-12 text-base"
							text="Upgrade to Pro"
							onClick={handleUpgradeClick}
						/>
						<Button
							variant="outline"
							className="w-full sm:w-auto h-12 text-base  border border-text-muted text-text-muted hover:text-text"
							text="Start Free"
							onClick={() => router.push("/?auth=signup")}
						/>
					</div>
				</div>
			</main>

			{/* Minimal Footer */}
			<footer className="py-12 border-t border-stroke/50 text-center text-sm text-text-muted">
				<p>© {new Date().getFullYear()} Labeld. All rights reserved.</p>
			</footer>
		</div>
	);
}
