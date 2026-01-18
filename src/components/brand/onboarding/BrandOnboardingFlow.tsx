"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

// Import existing forms and components
import ProfileForm, { ProfileFormData } from "@/components/user/ProfileForm";
import BrandIdentityForm from "@/components/brand/forms/BrandIdentity";
import BrandVisualsForm from "@/components/brand/forms/BrandVisuals";
import BrandStoryForm from "@/components/brand/forms/BrandStory";
import BrandLocationForm from "@/components/brand/forms/BrandLocation";
import AuthForm from "@/app/marketing/auth/AuthFom";

// Import validation and API functions
import { validateUsername } from "@/lib/validation/username";
import { updateUserCF } from "@/lib/firebase/callables/users";
import { addBrandCF } from "@/lib/firebase/callables/brand";
import { uploadProfileImageCloudinary } from "@/lib/storage/cloudinary";
import { uploadBrandImageCloudinary } from "@/lib/storage/cloudinary";
import { useBrandOnboard } from "@/lib/stores/brandOnboard";

// Types
interface BrandOnboardingData {
	profile: ProfileFormData;
	skipBrandSetup: boolean;
}

type Step = 1 | 2 | 3 | "auth";

// Progress calculation
const calculateProgress = (
	data: BrandOnboardingData,
	brandData: any
): {
	required: number;
	optional: number;
	requiredPercent: number;
	optionalPercent: number;
} => {
	let totalRequiredFields = 2; // Username, Display Name
	let totalOptionalFields = 1; // Profile Photo

	if (!data.skipBrandSetup) {
		totalRequiredFields += 4; // Brand Name, Username, Category, Logo
		totalOptionalFields += 8; // Cover, Bio, Tags, State, Country, Socials (3)
	}

	let completedRequiredFields = 0;
	let completedOptionalFields = 0;

	if (data.profile.username.trim()) completedRequiredFields++;
	if (data.profile.displayName.trim()) completedRequiredFields++;

	// Profile photo is optional
	if (data.profile.profileFile) completedOptionalFields++;

	if (!data.skipBrandSetup) {
		if (brandData.brandName.trim()) completedRequiredFields++;
		if (brandData.brandUsername.trim()) completedRequiredFields++;
		if (brandData.brandCategory) completedRequiredFields++;
		if (brandData.logoFile) completedRequiredFields++;

		if (brandData.coverFile) completedOptionalFields++;
		if (brandData.bio?.trim()) completedOptionalFields++;
		if (brandData.tags.length > 0) completedOptionalFields++;
		if (brandData.state?.trim()) completedOptionalFields++;
		if (brandData.country?.trim()) completedOptionalFields++;
		if (brandData.instagram?.trim()) completedOptionalFields++;
		if (brandData.youtube?.trim()) completedOptionalFields++;
		if (brandData.tiktok?.trim()) completedOptionalFields++;
	}

	const requiredPercent = Math.round(
		(completedRequiredFields / totalRequiredFields) * 100
	);
	const optionalPercent =
		totalOptionalFields > 0
			? Math.round((completedOptionalFields / totalOptionalFields) * 100)
			: 0;

	return {
		required: completedRequiredFields,
		optional: completedOptionalFields,
		requiredPercent,
		optionalPercent,
	};
};

// FlowContainer - defined OUTSIDE to prevent remounting on parent re-render
function FlowContainer({
	isModal,
	onClose,
	children,
}: {
	isModal: boolean;
	onClose?: () => void;
	children: React.ReactNode;
}) {
	if (isModal) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div
					className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
					onClick={onClose}
				/>
				<div className="relative bg-bg border border-stroke rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
					{children}
				</div>
			</div>
		);
	}
	return (
		<div className="max-w-xl mx-auto w-full bg-surface border border-stroke rounded-2xl overflow-hidden flex flex-col shadow-sm my-8">
			{children}
		</div>
	);
}

interface BrandOnboardingFlowProps {
	isModal?: boolean;
	initialStep?: Step;
	onClose?: () => void;
}

export default function BrandOnboardingFlow({
	isModal = true,
	initialStep = 1,
	onClose,
}: BrandOnboardingFlowProps) {
	const router = useRouter();
	const auth = getAuth();
	const brandData = useBrandOnboard();

	const [currentStep, setCurrentStep] = useState<Step>(initialStep);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [profileData, setProfileData] = useState<ProfileFormData>(() => {
		// Only load from local storage if we are in the browser and starting fresh
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("brandOnboardingProfile");
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					return {
						...parsed,
						profileFile: null,
						isBrand: true,
					};
				} catch (e) {
					console.warn("Failed to parse saved profile data");
				}
			}
		}

		return {
			username: "",
			displayName: "",
			profileFile: null,
			isBrand: true,
		};
	});

	const [skipBrandSetup, setSkipBrandSetup] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const dataToSave = {
				...profileData,
				profileFile: null,
			};
			localStorage.setItem(
				"brandOnboardingProfile",
				JSON.stringify(dataToSave)
			);
		}
	}, [profileData]);

	// NEW: Prefill data for existing users
	useEffect(() => {
		const fetchUserData = async () => {
			if (auth.currentUser) {
				try {
					const { doc, getDoc, getFirestore } = await import(
						"firebase/firestore"
					);
					const db = getFirestore();
					const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

					if (userDoc.exists()) {
						const userData = userDoc.data();
						const newProfileData = {
							username: userData.username || "",
							displayName:
								userData.displayName || auth.currentUser.displayName || "",
							profileFile: null, // Can't prefill file object
							isBrand: true,
						};

						setProfileData(newProfileData);

						// Auto-skip to Step 2 if we have valid profile data and currently on Step 1
						// and ONLY if we are not in modal mode (assuming modal is used for fresh signup primarily, but user said "setup page")
						// Actually, user wants it for the setup page flow.
						if (initialStep === 1 && currentStep === 1) {
							if (newProfileData.username && newProfileData.displayName) {
								setCurrentStep(2);
							}
						}
					}
				} catch (err) {
					console.error("Failed to fetch existing user data", err);
				}
			}
		};

		fetchUserData();
	}, [auth.currentUser, initialStep]); // Run once when user is detected

	const progress = useMemo(
		() =>
			calculateProgress({ profile: profileData, skipBrandSetup }, brandData),
		[profileData, skipBrandSetup, brandData]
	);

	const canProceedFromStep1 = useMemo(() => {
		const { username, displayName } = profileData;
		const { ok } = validateUsername(username);
		return ok && displayName.trim().length > 0;
	}, [profileData]);

	const canProceedFromStep2 = useMemo(() => {
		if (skipBrandSetup) return true;
		const { brandName, brandUsername, brandCategory, logoFile } = brandData;
		const { ok } = validateUsername(brandUsername);
		return (
			ok &&
			brandName.trim().length > 0 &&
			// phoneNumber.trim().length > 0 && // Ignored for now
			brandCategory &&
			logoFile
		);
	}, [brandData, skipBrandSetup]);

	const canProceedFromStep3 = useMemo(() => {
		return true; // Step 3 is optional
	}, []);

	const handleNext = () => {
		setError(null);
		if (currentStep === 1) {
			if (canProceedFromStep1) {
				setCurrentStep(2);
			}
		} else if (currentStep === 2) {
			if (canProceedFromStep2) {
				setCurrentStep(3);
			}
		} else if (currentStep === 3) {
			// Check if user is already authenticated (e.g. creating brand from dashboard)
			if (auth.currentUser) {
				// If authenticated, we skip "AuthForm" and go straight to submission
				handleCompleteSignup("signup"); // Re-use logic or separate?
				// Wait, handleCompleteSignup calls methods that might expect an auth trigger.
				// Let's modify handleCompleteSignup to handle "authenticated" flow.
			} else {
				setCurrentStep("auth");
			}
		}
	};

	const handleBack = () => {
		setError(null);
		if (currentStep === 1 && !isModal) {
			// If page mode and step 1, maybe go back to dashboard?
			router.back();
			return;
		}

		if (currentStep === 2) {
			setCurrentStep(1);
		} else if (currentStep === 3) {
			setCurrentStep(2);
		} else if (currentStep === "auth") {
			setCurrentStep(3);
		}
	};

	const handleSkipBrandSetup = () => {
		setSkipBrandSetup(true);
		if (auth.currentUser) {
			handleCompleteSignup("signup");
		} else {
			setCurrentStep("auth");
		}
	};

	const handleCompleteSignup = async (mode: "signup") => {
		// mode is kept for compatibility with AuthForm props, but we always treat it as "execute"
		setLoading(true);
		setError(null);

		try {
			const user = auth.currentUser;
			if (!user) {
				setError("Please sign in first");
				setLoading(false);
				return;
			}

			// 1. Update user profile (if data provided)
			let profileImageUrl: string | null = null;
			if (profileData.profileFile) {
				try {
					profileImageUrl = await uploadProfileImageCloudinary(
						profileData.profileFile,
						user.uid
					);
				} catch (cloudinaryError) {
					console.warn("Profile image upload failed:", cloudinaryError);
				}
			}

			// Only update user if we have new data or it's the initial signup
			// For dashboard usage, we might verify what needs updating, but updating again is safe enough
			await updateUserCF({
				email: user.email,
				username: profileData.username,
				displayName: profileData.displayName,
				profileImageUrl,
				isBrand: true,
				brandSpaceSetupComplete: skipBrandSetup ? false : true,
				profileSetupComplete: true,
			});

			// NEW: Save phone number to user doc explicitly
			if (brandData.phoneNumber) {
				try {
					const { getFirestore, doc, updateDoc } = await import(
						"firebase/firestore"
					);
					const db = getFirestore();
					await updateDoc(doc(db, "users", user.uid), {
						phoneNumber: brandData.phoneNumber,
					});
				} catch (err) {
					console.warn("Failed to update user phone number", err);
				}
			}

			// 2. Create brand if not skipped
			if (!skipBrandSetup) {
				// Upload brand images
				let logoUrl: string;
				try {
					// Check if file exists, or if we need to reuse checking
					if (!brandData.logoFile) throw new Error("Logo is required"); // Should be caught by validation, but double check
					logoUrl = await uploadBrandImageCloudinary(
						brandData.logoFile!,
						user.uid
					);
				} catch (cloudinaryError) {
					console.warn("Brand logo upload failed:", cloudinaryError);
					// For dashboard existing users, they might be re-submitting?
					// Assuming this flow is for NEW brands mostly.
					throw new Error("Failed to upload brand logo");
				}

				let coverImageUrl: string | null = null;
				if (brandData.coverFile) {
					try {
						coverImageUrl = await uploadBrandImageCloudinary(
							brandData.coverFile,
							user.uid
						);
					} catch (cloudinaryError) {
						console.warn("Brand cover upload failed:", cloudinaryError);
					}
				}

				// Create brand
				await addBrandCF({
					brandName: brandData.brandName,
					username: brandData.brandUsername,
					// phoneNumber: brandData.phoneNumber, // New field
					bio: brandData.bio || null,
					category: brandData.brandCategory || "streetwear",
					brandTags: brandData.tags.length ? brandData.tags : null,
					logoUrl,
					coverImageUrl,
					state: brandData.state || null,
					country: brandData.country || null,
					instagram: brandData.instagram || null,
					youtube: brandData.youtube || null,
					tiktok: brandData.tiktok || null,
				});
			}

			// 3. Clear saved data and redirect
			localStorage.removeItem("brandOnboardingProfile");
			brandData.reset();

			if (isModal && onClose) {
				onClose();
				router.push("/dashboard");
			} else {
				router.push("/dashboard");
			}
		} catch (e) {
			console.error(e);
			setError(e instanceof Error ? e.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<FlowContainer isModal={isModal} onClose={onClose}>
			{/* Header */}
			<div className="flex items-center justify-between p-6 border-b border-stroke">
				<div className="flex items-center gap-4">
					<button
						onClick={handleBack}
						disabled={currentStep === 1 && isModal}
						className="p-2 rounded-lg border border-stroke hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<ArrowLeft className="w-4 h-4" />
					</button>
					<div>
						<h2 className="font-heading font-semibold text-xl">
							{currentStep === 1 && "Set Up Your Profile"}
							{currentStep === 2 && "Build Your Brand"}
							{currentStep === 3 && "Tell Your Story"}
							{currentStep === "auth" && "Create Your Account"}
						</h2>
						<p className="text-sm text-text-muted">
							Step {currentStep === "auth" ? "Final" : currentStep} of 3
							{!skipBrandSetup && currentStep !== "auth" && " • Brand Setup"}
							{skipBrandSetup &&
								currentStep !== "auth" &&
								" • Skip Brand Setup"}
						</p>
					</div>
				</div>
				{isModal && onClose && (
					<button
						onClick={onClose}
						className="p-2 text-text-muted hover:text-text transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				)}
			</div>

			{/* Progress Bar */}
			<div className="px-6 pb-4 pt-4">
				<div className="flex items-center justify-between text-xs text-text-muted mb-2">
					<span>Progress</span>
					<span>
						{progress.requiredPercent}% Required
						{!skipBrandSetup &&
							progress.optionalPercent > 0 &&
							` • ${progress.optionalPercent}% Optional`}
					</span>
				</div>
				<div className="w-full bg-stroke rounded-full h-3 overflow-hidden flex">
					{/* Calculate proportional widths */}
					{(() => {
						const totalPossibleFields = skipBrandSetup ? 3 : 15; // 2 req/1 opt OR 6 req/9 opt

						// Calculate width based on COMPLETED items relative to TOTAL items
						const requiredWidth =
							(progress.required / totalPossibleFields) * 100;
						const optionalWidth =
							(progress.optional / totalPossibleFields) * 100;

						return (
							<>
								{/* Required Progress - Accent Color */}
								<div
									className="bg-accent h-3 transition-all duration-300 flex items-center justify-center"
									style={{ width: `${requiredWidth}%` }}
								>
									{progress.requiredPercent > 15 && (
										<span className="text-[10px] font-heading font-semibold text-bg px-2">
											{progress.requiredPercent}
										</span>
									)}
								</div>

								{/* Optional Progress - CTA Color (only if not skipped) */}
								{!skipBrandSetup && (
									<div
										className="bg-cta h-3 transition-all duration-300 flex items-center justify-center"
										style={{ width: `${optionalWidth}%` }}
									>
										{progress.optionalPercent > 15 && (
											<span className="text-[10px] font-heading font-semibold text-white px-2">
												{progress.optionalPercent}
											</span>
										)}
									</div>
								)}
							</>
						);
					})()}
				</div>
			</div>

			{/* Content */}
			<div className="p-6 overflow-y-auto flex-1 min-h-0">
				{error && (
					<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
						<p className="text-sm text-red-600">{error}</p>
					</div>
				)}

				{currentStep === 1 && (
					<div className="space-y-6">
						<div>
							<h3 className="font-semibold text-lg mb-2">
								Profile Information
							</h3>
							<p className="text-text-muted text-sm mb-4">
								Let's start with the basics. This information will be used for
								your account.
							</p>
						</div>
						<ProfileForm
							value={profileData}
							onChange={setProfileData}
							isValidUsername={validateUsername(profileData.username).ok}
						/>
					</div>
				)}

				{currentStep === 2 && (
					<div className="space-y-6">
						<div>
							<h3 className="font-semibold text-lg mb-2">
								Brand Identity & Visuals
							</h3>
							<p className="text-text-muted text-sm mb-4">
								Set up your brand's identity and visual elements. You can skip
								this step if you want to set up your brand later.
							</p>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
							<div>
								<h4 className="font-medium mb-4">Brand Identity</h4>
								<BrandIdentityForm />
							</div>
							<div>
								<h4 className="font-medium mb-4">Brand Visuals</h4>
								<BrandVisualsForm />
							</div>
						</div>
					</div>
				)}

				{currentStep === 3 && !skipBrandSetup && (
					<div className="space-y-6">
						<div>
							<h3 className="font-semibold text-lg mb-2">
								Brand Story & Location
							</h3>
							<p className="text-text-muted text-sm mb-4">
								Add more details about your brand to complete your profile.
							</p>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
							<div>
								<h4 className="font-medium mb-4">Brand Story</h4>
								<BrandStoryForm />
							</div>
							<div>
								<h4 className="font-medium mb-4">Brand Location</h4>
								<BrandLocationForm />
							</div>
						</div>
					</div>
				)}

				{currentStep === "auth" && (
					<div className="max-w-md mx-auto">
						<div className="text-center mb-6">
							<h3 className="font-semibold text-lg mb-2">Almost Done!</h3>
							<p className="text-text-muted text-sm">
								Create your account to save all your information and start
								building your brand.
							</p>
						</div>
						<AuthForm
							mode="signup"
							onModeChange={() => {}}
							onSignupComplete={handleCompleteSignup}
						/>
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between p-6 border-t border-stroke">
				<div className="flex items-center gap-2">
					{currentStep === 2 && (
						<button
							onClick={handleSkipBrandSetup}
							className="text-sm text-text-muted hover:text-text transition-colors"
						>
							Skip Brand Setup
						</button>
					)}
				</div>
				<div className="flex items-center gap-3">
					{Math.abs((currentStep as number) - 3) < 0.1 ||
					(currentStep === 3 && auth.currentUser) ? (
						// Show Submit Button for Step 3 if authenticated OR if Step is "Auth" (handled by auth form usually but here we might wrap)
						<button
							onClick={() =>
								auth.currentUser ? handleCompleteSignup("signup") : handleNext()
							} // If auth, submit. If not auth, go to next (AuthForm)
							disabled={(currentStep === 3 && !canProceedFromStep3) || loading}
							className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cta text-text font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
						>
							{loading
								? "Creating..."
								: auth.currentUser
								? "Create Brand"
								: "Create Account"}
							<ArrowRight className="w-4 h-4" />
						</button>
					) : (
						currentStep !== "auth" && (
							<button
								onClick={handleNext}
								disabled={
									(currentStep === 1 && !canProceedFromStep1) ||
									(currentStep === 2 && !canProceedFromStep2) ||
									loading
								}
								className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cta text-text font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
							>
								Next
								<ArrowRight className="w-4 h-4" />
							</button>
						)
					)}
				</div>
			</div>
		</FlowContainer>
	);
}
