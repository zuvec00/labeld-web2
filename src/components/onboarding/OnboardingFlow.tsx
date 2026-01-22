"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { updateUserCF } from "@/lib/firebase/callables/users";
import { addBrandCF } from "@/lib/firebase/callables/brand";
import { uploadBrandImageCloudinary } from "@/lib/storage/cloudinary";
import IntentStep from "./steps/IntentStep";
import ProfileStep from "./steps/ProfileStep";
import IdentityStep from "./steps/IdentityStep";
import BrandVisualsStep from "./steps/BrandVisualsStep";
import BrandDetailsStep from "./steps/BrandDetailsStep";
import ReadyStep from "./steps/ReadyStep";
import Image from "next/image";

import AuthForm from "@/app/marketing/auth/AuthFom";

type Step =
	| "intent"
	| "profile"
	| "identity"
	| "visuals"
	| "details"
	| "auth"
	| "ready";

export default function OnboardingFlow() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuth();
	const brandData = useBrandOnboard();
	const [step, setStep] = useState<Step>("intent");
	const [isLoading, setIsLoading] = useState(false);
	const [loadingMessage, setLoadingMessage] = useState("");

	useEffect(() => {
		if (searchParams.get("step") === "profile") {
			setStep("profile");
		}
	}, [searchParams]);

	const handleIntentSelect = (intent: "brand" | "explore" | "later") => {
		if (intent === "brand") {
			setStep("profile");
		} else {
			// Mark onboarding as skipped/complete for now
			handleSkip();
		}
	};

	const handleSkip = async () => {
		if (user) {
			try {
				await updateUserCF({
					email: user.email!,
					isBrand: false,
					brandSpaceSetupComplete: false,
				});
			} catch (e) {
				console.error("Failed to update user preference", e);
			}
		}
		router.push("/dashboard");
	};

	const handlePreAuthComplete = () => {
		if (user) {
			handleCompleteSetup();
		} else {
			setStep("auth");
		}
	};

	const handleAuthComplete = async () => {
		// User just signed up/logged in.
		// We'll call the setup completion.
		await handleCompleteSetup();
	};

	const handleCompleteSetup = async () => {
		// Fetch current user just to be safe
		const { getAuth } = await import("firebase/auth");
		const currentUser = getAuth().currentUser;
		if (!currentUser) return;

		setIsLoading(true);
		setLoadingMessage("Setting up your profile for the culture...");

		try {
			// 0. Upload User Profile Image
			let userProfileUrl = "";
			if (brandData.userProfileFile) {
				try {
					const { uploadProfileImageCloudinary } =
						await import("@/lib/storage/cloudinary");
					userProfileUrl = await uploadProfileImageCloudinary(
						brandData.userProfileFile,
						currentUser.uid,
					);
				} catch (e) {
					console.error("User profile upload failed", e);
				}
			}

			// Only create brand space if brand name is provided (not skipped)
			const hasBrandDetails = !!brandData.brandName;

			let logoUrl = "";
			let coverUrl = "";

			if (hasBrandDetails) {
				setLoadingMessage("Uploading your brand visuals...");
				if (brandData.logoFile) {
					try {
						logoUrl = await uploadBrandImageCloudinary(
							brandData.logoFile,
							currentUser.uid,
						);
					} catch (e) {
						console.error("Logo upload failed", e);
					}
				}

				if (brandData.coverFile) {
					try {
						coverUrl = await uploadBrandImageCloudinary(
							brandData.coverFile,
							currentUser.uid,
						);
					} catch (e) {
						console.error("Cover upload failed", e);
					}
				}

				setLoadingMessage("Creating your brand space...");
				await addBrandCF({
					brandName: brandData.brandName,
					username: brandData.brandUsername,
					bio: brandData.bio || null,
					category: brandData.brandCategory || "streetwear",
					brandTags: brandData.tags,
					logoUrl: logoUrl,
					coverImageUrl: coverUrl || null,
					state: brandData.state || null,
					country: brandData.country || null,
					instagram: brandData.instagram || null,
					youtube: brandData.youtube || null,
					tiktok: brandData.tiktok || null,
				});
			}

			setLoadingMessage("Finalizing your setup...");
			// Update User
			await updateUserCF({
				email: currentUser.email!,
				username: brandData.userUsername,
				displayName: brandData.userDisplayName,
				profileImageUrl: userProfileUrl || null,
				isBrand: hasBrandDetails,
				brandSpaceSetupComplete: hasBrandDetails,
				profileSetupComplete: true,
			});

			setLoadingMessage("You're in. Welcome to the culture. 🔥");
			await new Promise((resolve) => setTimeout(resolve, 800)); // Brief pause for the vibe

			// Clear local store data after successful save
			brandData.reset();

			setStep("ready");
		} catch (error) {
			console.error("Setup failed:", error);
			// Show error toast?
		} finally {
			setIsLoading(false);
			setLoadingMessage("");
		}
	};

	const handleFinalLaunch = async () => {
		router.push("/dashboard");
	};

	// Progress "Momentum" Bar
	const progress = {
		intent: 0,
		profile: 10,
		identity: 30,
		visuals: 50,
		details: 75,
		auth: 90,
		ready: 100,
	}[step];

	return (
		<div className="min-h-screen bg-bg text-text flex flex-col items-center relative overflow-hidden">
			{/* Background Ambience */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-accent/5 to-transparent opacity-50" />
			</div>

			{/* Loading Overlay */}
			{isLoading && (
				<div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col items-center justify-center">
					<div className="flex flex-col items-center gap-6 max-w-md mx-auto px-6 text-center">
						{/* Animated Logo/Spinner */}
						<div className="relative">
							<div className="w-16 h-16 rounded-full border-2 border-accent/20 animate-ping absolute inset-0" />
							<div className="w-16 h-16 rounded-full border-2 border-t-accent border-r-accent/50 border-b-accent/20 border-l-accent/50 animate-spin" />
						</div>
						{/* Loading Message */}
						<p className="text-lg font-medium text-text animate-pulse">
							{loadingMessage}
						</p>
					</div>
				</div>
			)}

			{/* Header / Nav (Minimal) */}
			<header className="w-full max-w-7xl mx-auto p-6 md:p-8 flex items-center justify-between relative z-10">
				<div className="flex items-center gap-2">
					<Image
						src="/labeld_logo.png"
						alt="Labeld"
						width={40}
						height={40}
						className="w-10 h-10"
					/>
				</div>
				{/* Momentum Progress Bar */}
				<div className="flex flex-col items-end gap-1 w-32 md:w-64">
					<div className="text-xs text-text-muted font-medium mb-1">
						{step === "intent" && "Start"}
						{step === "profile" && "Step 1"}
						{step === "identity" && "Step 2"}
						{step === "visuals" && "Step 3"}
						{step === "details" && "Step 4"}
						{step === "auth" && "Final"}
						{step === "ready" && "Launch"}
					</div>
					<div className="w-full h-1 bg-surface rounded-full overflow-hidden">
						<div
							className="h-full bg-accent transition-all duration-700 ease-out"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 relative z-10 flex flex-col">
				{step === "intent" && <IntentStep onSelect={handleIntentSelect} />}
				{step === "profile" && (
					<ProfileStep
						onNext={() => setStep("identity")}
						onBack={() => setStep("intent")}
						onSkip={() => setStep("auth")}
					/>
				)}
				{step === "identity" && (
					<IdentityStep
						onNext={() => setStep("visuals")}
						onBack={() => setStep("profile")}
					/>
				)}
				{step === "visuals" && (
					<BrandVisualsStep
						onNext={() => setStep("details")}
						onBack={() => setStep("identity")}
					/>
				)}
				{step === "details" && (
					<BrandDetailsStep
						onNext={handlePreAuthComplete}
						onBack={() => setStep("visuals")}
					/>
				)}
				{step === "auth" && (
					<div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-700">
						<div className="max-w-md mx-auto w-full">
							<h2 className="text-3xl font-heading font-bold mb-2 text-center">
								Save Your Progress
							</h2>
							<p className="text-text-muted mb-8 text-center">
								Create your account to claim{" "}
								<strong>{brandData.brandName}</strong>.
							</p>
							<AuthForm
								mode="signup"
								onSignupComplete={async () => {
									await handleAuthComplete();
								}}
								submitButtonText="Complete & Launch"
							/>
						</div>
					</div>
				)}
				{step === "ready" && <ReadyStep onComplete={handleFinalLaunch} />}
			</main>
		</div>
	);
}
