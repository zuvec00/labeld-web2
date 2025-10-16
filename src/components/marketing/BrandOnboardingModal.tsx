"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import Image from "next/image";

// Import existing forms and components
import ProfileForm, { ProfileFormData } from "@/components/user/ProfileForm";
import BrandIdentityForm from "@/components/brand/forms/BrandIdentity";
import BrandVisualsForm from "@/components/brand/forms/BrandVisuals";
import BrandStoryForm from "@/components/brand/forms/BrandStory";
import BrandLocationForm from "@/components/brand/forms/BrandLocation";
import AuthForm from "@/app/marketing/auth/AuthFom";

// Import validation and API functions
import { validateUsername } from "@/lib/validation/username";
import {
	checkUsernameUniqueCF,
	updateUserCF,
	addUserCF,
} from "@/lib/firebase/callables/users";
import {
	checkBrandUsernameUniqueCF,
	addBrandCF,
} from "@/lib/firebase/callables/brand";
import { uploadProfileImageCloudinary } from "@/lib/storage/cloudinary";
import { uploadBrandImageCloudinary } from "@/lib/storage/cloudinary";
import { useBrandOnboard } from "@/lib/stores/brandOnboard";

// Types
interface BrandOnboardingData {
	profile: ProfileFormData;
	skipBrandSetup: boolean;
}

type Step = 1 | 2 | 3 | "auth";

// Progress calculation - counts both REQUIRED and OPTIONAL fields
const calculateProgress = (
	data: BrandOnboardingData,
	brandData: any
): {
	required: number;
	optional: number;
	requiredPercent: number;
	optionalPercent: number;
} => {
	// Calculate total required fields based on skip status
	let totalRequiredFields = 3; // Step 1: username, displayName, profileFile (required)
	let totalOptionalFields = 0; // Optional fields

	if (!data.skipBrandSetup) {
		totalRequiredFields += 4; // Step 2: brandName, brandUsername, brandCategory, logoFile (required)
		totalOptionalFields += 7; // Step 3: coverFile, bio, tags (up to 3), state, country, instagram, youtube, tiktok
	}

	let completedRequiredFields = 0;
	let completedOptionalFields = 0;

	// Step 1: Profile (3 REQUIRED fields)
	if (data.profile.username.trim()) completedRequiredFields++;
	if (data.profile.displayName.trim()) completedRequiredFields++;
	if (data.profile.profileFile) completedRequiredFields++;

	// Step 2: Brand (4 REQUIRED fields, only if not skipped)
	if (!data.skipBrandSetup) {
		if (brandData.brandName.trim()) completedRequiredFields++;
		if (brandData.brandUsername.trim()) completedRequiredFields++;
		if (brandData.brandCategory) completedRequiredFields++;
		if (brandData.logoFile) completedRequiredFields++;

		// Step 3: OPTIONAL fields
		if (brandData.coverFile) completedOptionalFields++;
		if (brandData.bio?.trim()) completedOptionalFields++;
		if (brandData.tags.length > 0) completedOptionalFields++; // Count tags as one field if any exist
		if (brandData.state?.trim()) completedOptionalFields++;
		if (brandData.country?.trim()) completedOptionalFields++;
		if (brandData.instagram?.trim()) completedOptionalFields++;
		if (brandData.youtube?.trim()) completedOptionalFields++;
		if (brandData.tiktok?.trim()) completedOptionalFields++;
	}

	// Calculate percentages
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

export default function BrandOnboardingModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const auth = getAuth();
	const brandData = useBrandOnboard();

	const [currentStep, setCurrentStep] = useState<Step>(1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Initialize profile data from localStorage or defaults
	const [profileData, setProfileData] = useState<ProfileFormData>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("brandOnboardingProfile");
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					// Ensure profileFile is null since File objects can't be serialized
					return {
						...parsed,
						profileFile: null,
						isBrand: true, // Always true for brand flow
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
			isBrand: true, // Always true for brand flow
		};
	});

	const [skipBrandSetup, setSkipBrandSetup] = useState(false);

	// Save profile data to localStorage whenever it changes (excluding File objects)
	useEffect(() => {
		if (typeof window !== "undefined") {
			const dataToSave = {
				...profileData,
				profileFile: null, // Don't save File objects to localStorage
			};
			localStorage.setItem(
				"brandOnboardingProfile",
				JSON.stringify(dataToSave)
			);
		}
	}, [profileData]);

	// Calculate progress
	const progress = useMemo(
		() =>
			calculateProgress({ profile: profileData, skipBrandSetup }, brandData),
		[profileData, skipBrandSetup, brandData]
	);

	// Validation for each step
	const canProceedFromStep1 = useMemo(() => {
		const { username, displayName } = profileData;
		const { ok } = validateUsername(username);
		return ok && displayName.trim().length > 0;
	}, [profileData]);

	const canProceedFromStep2 = useMemo(() => {
		if (skipBrandSetup) return true;
		const { brandName, brandUsername, brandCategory, logoFile } = brandData;
		const { ok } = validateUsername(brandUsername);
		return ok && brandName.trim().length > 0 && brandCategory && logoFile;
	}, [brandData, skipBrandSetup]);

	const canProceedFromStep3 = useMemo(() => {
		return true; // Step 3 is optional
	}, []);

	// Navigation handlers
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
			setCurrentStep("auth");
		}
	};

	const handleBack = () => {
		setError(null);
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
		setCurrentStep("auth");
	};

	const handleCompleteSignup = async (mode: "signup") => {
		if (mode !== "signup") return;

		setLoading(true);
		setError(null);

		try {
			const user = auth.currentUser;
			if (!user) {
				setError("Please sign in first");
				return;
			}

			// 1. Create user profile
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

			await updateUserCF({
				email: user.email,
				username: profileData.username,
				displayName: profileData.displayName,
				profileImageUrl,
				isBrand: true,
				brandSpaceSetupComplete: skipBrandSetup ? false : true,
				profileSetupComplete: true,
			});

			// 2. Create brand if not skipped
			if (!skipBrandSetup) {
				// Upload brand images
				let logoUrl: string;
				try {
					logoUrl = await uploadBrandImageCloudinary(
						brandData.logoFile!,
						user.uid
					);
				} catch (cloudinaryError) {
					console.warn("Brand logo upload failed:", cloudinaryError);
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
			router.push("/dashboard");
			onClose();
		} catch (e) {
			console.error(e);
			setError(e instanceof Error ? e.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal Content */}
			<div className="relative bg-bg border border-stroke rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-stroke">
					<div className="flex items-center gap-4">
						<button
							onClick={handleBack}
							disabled={currentStep === 1}
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
					<button
						onClick={onClose}
						className="p-2 text-text-muted hover:text-text transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Progress Bar */}
				<div className="px-6 pb-4">
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
							const totalPossibleFields = skipBrandSetup ? 3 : 10; // 3 required + 7 optional
							const requiredWidth = (3 / totalPossibleFields) * 100;
							const optionalWidth = skipBrandSetup
								? 0
								: (7 / totalPossibleFields) * 100;

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
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
						{currentStep !== "auth" && (
							<button
								onClick={handleNext}
								disabled={
									(currentStep === 1 && !canProceedFromStep1) ||
									(currentStep === 2 && !canProceedFromStep2) ||
									(currentStep === 3 && !canProceedFromStep3) ||
									loading
								}
								className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cta text-text font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
							>
								{currentStep === 3 ? "Create Account" : "Next"}
								<ArrowRight className="w-4 h-4" />
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
