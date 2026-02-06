"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useEventOrganizerOnboard } from "@/lib/stores/eventOrganizerStore";
import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { updateUserCF } from "@/lib/firebase/callables/users";
import {
	uploadProfileImageCloudinary,
	uploadBrandImageCloudinary,
} from "@/lib/storage/cloudinary";
import { db } from "@/lib/firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { slugify } from "@/lib/utils";

import IntentStep from "./steps/IntentStep";
import EventIdentityStep from "./steps/EventIdentityStep";
import EventDetailsStep from "./steps/EventDetailsStep";
import EventVisualsStep from "./steps/EventVisualsStep";
import ReadyStep from "./steps/ReadyStep";
import AuthForm from "@/app/marketing/auth/AuthFom";
import Image from "next/image";
import ProfileStep from "./steps/ProfileStep"; // Import ProfileStep

type Step =
	| "intent"
	| "profile"
	| "identity"
	| "details"
	| "visuals"
	| "auth"
	| "ready";

export default function EventOnboardingFlow() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuth();
	const {
		data: eventData,
		setData,
		reset: resetEventData,
	} = useEventOrganizerOnboard();
	const {
		userDisplayName,
		userUsername,
		userProfileFile,
		reset: resetBrandData,
	} = useBrandOnboard(); // Read user data from BrandStore
	const [step, setStep] = useState<Step>("intent"); // Start at intent, then profile
	const [isLoading, setIsLoading] = useState(false);
	const [loadingMessage, setLoadingMessage] = useState("");

	useEffect(() => {
		const stepParam = searchParams.get("step");
		if (stepParam === "profile") {
			setStep("profile");
		} else if (stepParam === "identity") {
			setStep("identity");
		}
	}, [searchParams]);

	const handleIntentSelect = (intent: "brand" | "explore" | "later") => {
		// Technically "Launch a Brand" intent might not map perfectly here if they clicked "Drop Events".
		// But if they start here, we assume they want to drop events.
		// We can skip intent step if we force it via URL, which we should for "Drop Events" button.
		setStep("identity");
	};

	const handleSkip = async () => {
		// ... same user update logic if needed
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
		await handleCompleteSetup();
	};

	const handleCompleteSetup = async () => {
		const { getAuth } = await import("firebase/auth");
		const currentUser = getAuth().currentUser;
		if (!currentUser) return;

		setIsLoading(true);
		setLoadingMessage("Setting up your profile for the culture...");

		try {
			// 1. Upload User Profile Image (from BrandStore used in ProfileStep)
			let userProfileUrl = "";
			if (userProfileFile) {
				try {
					userProfileUrl = await uploadProfileImageCloudinary(
						userProfileFile,
						currentUser.uid,
					);
				} catch (e) {
					console.error("User profile upload failed", e);
				}
			}

			const hasEventDetails = !!eventData.organizerName;

			let logoUrl = "";
			let coverUrl = "";

			if (hasEventDetails) {
				setLoadingMessage("Uploading your organizer visuals...");
				// Upload Event Organizer Visuals
				if (eventData.profileFile) {
					try {
						logoUrl = await uploadProfileImageCloudinary(
							eventData.profileFile,
							currentUser.uid,
						);
					} catch (e) {
						console.error("Org Logo upload failed", e);
					}
				}
				if (eventData.coverFile) {
					try {
						// Assuming reusing profile upload or generic
						logoUrl = await uploadProfileImageCloudinary(
							eventData.coverFile,
							currentUser.uid,
						);
					} catch (e) {
						console.error("Org Cover upload failed", e);
					}
				}
			}

			setLoadingMessage("Finalizing your setup...");
			// 2. Update User Profile
			await updateUserCF({
				email: currentUser.email!,
				username: userUsername, // From BrandStore
				displayName: userDisplayName, // From BrandStore
				profileImageUrl: userProfileUrl || undefined,
				isBrand: false, // Keeping false as this is Event Flow (or maybe true if organizers count as brands?)
				brandSpaceSetupComplete: hasEventDetails,
				profileSetupComplete: true,
			});

			if (hasEventDetails) {
				setLoadingMessage("Creating your event organizer space...");
				// 3. Create Event Organizer Doc
				const eventOrganizerRef = doc(db, "eventOrganizers", currentUser.uid);
				await setDoc(eventOrganizerRef, {
					uid: currentUser.uid,
					organizerName: eventData.organizerName,
					username: eventData.username,
					bio: eventData.bio || null,
					eventCategory: eventData.eventCategory || "others",
					logoUrl,
					coverImageUrl: coverUrl || null,
					baseCity: eventData.baseCity || null,
					activeSince: eventData.activeSince || null,
					email: eventData.email || null,
					phone: eventData.phone || null,
					instagram: eventData.instagram || null,
					tiktok: eventData.tiktok || null,
					twitter: eventData.twitter || null,
					website: eventData.website || null,
					subscriptionTier: "free", // Default to free plan
					slug: slugify(eventData.username), // Ensure slug is clean
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp(),
				});

				// Register public slug for the event organizer (experience)
				try {
					const { reserveSlug } = await import("@/lib/firebase/slugs");
					const initialSlug = slugify(eventData.username);
					await reserveSlug(
						initialSlug,
						"experience", // "experience" as per user request (was "event")
						currentUser.uid,
						currentUser.uid,
					);
				} catch (e) {
					console.error("Failed to reserve public slug for event organizer", e);
				}
			}

			setLoadingMessage("You're in. Let's drop some events. 🎉");
			await new Promise((resolve) => setTimeout(resolve, 800)); // Brief pause for the vibe

			// Clear local store data after successful save
			resetEventData();
			resetBrandData();

			setStep("ready");
		} catch (error) {
			console.error("Setup failed:", error);
		} finally {
			setIsLoading(false);
			setLoadingMessage("");
		}
	};

	const handleFinalLaunch = async () => {
		router.push("/events"); // Redirect to events dashboard
	};

	const progress = {
		intent: 0,
		profile: 15,
		identity: 30,
		details: 50,
		visuals: 70,
		auth: 90,
		ready: 100,
	}[step];

	return (
		<div className="min-h-screen bg-bg text-text flex flex-col items-center relative overflow-hidden">
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-accent/5 to-transparent opacity-50" />
			</div>

			{/* Loading Overlay */}
			{isLoading && (
				<div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex flex-col items-center justify-center">
					<div className="flex flex-col items-center gap-6 max-w-md mx-auto px-6 text-center">
						{/* Animated Spinner */}
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
				<div className="flex flex-col items-end gap-1 w-32 md:w-64">
					<div className="text-xs text-text-muted font-medium mb-1">
						{step === "intent" && "Start"}
						{step === "profile" && "Identity"}
						{step === "identity" && "Event Info"}
						{step === "details" && "Details"}
						{step === "visuals" && "Visuals"}
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

			<main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8 relative z-10 flex flex-col">
				{step === "intent" && (
					<IntentStep onSelect={(intent) => setStep("profile")} />
				)}
				{step === "profile" && (
					<ProfileStep
						onNext={() => setStep("identity")}
						onBack={() => setStep("intent")}
						onSkip={() => setStep("auth")}
					/>
				)}
				{step === "identity" && (
					<EventIdentityStep
						onNext={() => setStep("details")}
						onBack={() => setStep("profile")}
					/>
				)}
				{step === "details" && (
					<EventDetailsStep
						onNext={() => setStep("visuals")}
						onBack={() => setStep("identity")}
					/>
				)}
				{step === "visuals" && (
					<EventVisualsStep
						onNext={handlePreAuthComplete}
						onBack={() => setStep("details")}
					/>
				)}
				{step === "auth" && (
					<div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-700">
						<div className="max-w-md mx-auto w-full">
							<h2 className="text-3xl font-heading font-bold mb-2 text-center">
								Save Your Progress
							</h2>
							<p className="text-text-muted mb-8 text-center">
								Create your account to start dropping events as{" "}
								<strong>{eventData.organizerName}</strong>.
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
				{step === "ready" && (
					<ReadyStep onComplete={handleFinalLaunch} label="Enter Event Space" />
				)}
			</main>
		</div>
	);
}
