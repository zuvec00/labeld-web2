"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthForm from "@/app/marketing/auth/AuthFom";
import ProfileForm from "@/components/user/ProfileForm";
import EventIdentityForm from "@/components/events/forms/EventIdentityForm";
import EventVisualsForm from "@/components/events/forms/EventVisualsForm";
import EventDetailsForm from "@/components/events/forms/EventDetailsForm";
import { useEventOrganizerOnboard } from "@/lib/stores/eventOrganizerStore";
import { validateUsername } from "@/lib/validation/username";
import { updateUserCF } from "@/lib/firebase/callables/users";
import { uploadProfileImageCloudinary } from "@/lib/storage/cloudinary";
import { db } from "@/lib/firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface ProfileFormData {
	username: string;
	displayName: string;
	profileFile: File | null;
	isBrand: boolean;
}

interface EventOnboardingData {
	profile: ProfileFormData;
	skipEventSetup: boolean;
}

type Step = 1 | 2 | 3 | "auth";

// Progress calculation - counts both REQUIRED and OPTIONAL fields
const calculateProgress = (
	data: EventOnboardingData,
	eventData: any,
	skipProfileStep = false
): {
	required: number;
	optional: number;
	requiredPercent: number;
	optionalPercent: number;
} => {
	// Calculate total required fields based on skip status
	let totalRequiredFields = skipProfileStep ? 0 : 3; // Step 1: username, displayName, profileFile (required)
	let totalOptionalFields = 0; // Optional fields

	if (!data.skipEventSetup) {
		totalRequiredFields += 4; // Step 2: organizerName, organizerUsername, eventCategory, profileFile (required)
		totalOptionalFields += 8; // Step 3: coverFile, bio, baseCity, activeSince, email, phone, instagram, tiktok, twitter, website
	}

	let completedRequiredFields = 0;
	let completedOptionalFields = 0;

	// Step 1: Profile (3 REQUIRED fields, only if not skipped)
	if (!skipProfileStep) {
		if (data.profile.username.trim()) completedRequiredFields++;
		if (data.profile.displayName.trim()) completedRequiredFields++;
		if (data.profile.profileFile) completedRequiredFields++;
	}

	// Step 2: Event Organizer (4 REQUIRED fields, only if not skipped)
	if (!data.skipEventSetup) {
		if (eventData.organizerName.trim()) completedRequiredFields++;
		if (eventData.organizerUsername.trim()) completedRequiredFields++;
		if (eventData.eventCategory) completedRequiredFields++;
		if (eventData.profileFile) completedRequiredFields++;

		// Step 3: OPTIONAL fields
		if (eventData.coverFile) completedOptionalFields++;
		if (eventData.bio?.trim()) completedOptionalFields++;
		if (eventData.baseCity?.trim()) completedOptionalFields++;
		if (eventData.activeSince?.trim()) completedOptionalFields++;
		if (eventData.email?.trim()) completedOptionalFields++;
		if (eventData.phone?.trim()) completedOptionalFields++;
		if (eventData.instagram?.trim()) completedOptionalFields++;
		if (eventData.tiktok?.trim()) completedOptionalFields++;
		if (eventData.twitter?.trim()) completedOptionalFields++;
		if (eventData.website?.trim()) completedOptionalFields++;
	}

	// Calculate percentages
	const requiredPercent =
		totalRequiredFields > 0
			? Math.round((completedRequiredFields / totalRequiredFields) * 100)
			: 100;
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

export default function EventOrganizerOnboardingModal({
	isOpen,
	onClose,
	onComplete,
}: {
	isOpen: boolean;
	onClose: () => void;
	onComplete?: () => void;
}) {
	const router = useRouter();
	const auth = getAuth();
	const eventData = useEventOrganizerOnboard();

	const [currentStep, setCurrentStep] = useState<Step>(onComplete ? 2 : 1); // Start at step 2 if opened from events page
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Initialize profile data from localStorage or defaults (only for initial signup)
	const [profileData, setProfileData] = useState<ProfileFormData>(() => {
		if (onComplete) {
			// If opened from events page, user already has profile - use current user data
			const user = auth.currentUser;
			return {
				username: user?.displayName || "",
				displayName: user?.displayName || "",
				profileFile: null,
				isBrand: false,
			};
		}

		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("eventOnboardingProfile");
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					return {
						...parsed,
						profileFile: null,
						isBrand: false,
					};
				} catch {
					console.warn("Failed to parse saved profile data");
				}
			}
		}

		return {
			username: "",
			displayName: "",
			profileFile: null,
			isBrand: false,
		};
	});

	const [skipEventSetup, setSkipEventSetup] = useState(false);

	// Save profile data to localStorage whenever it changes (excluding File objects)
	useEffect(() => {
		if (typeof window !== "undefined") {
			const dataToSave = {
				...profileData,
				profileFile: null, // Don't save File objects to localStorage
			};
			localStorage.setItem(
				"eventOnboardingProfile",
				JSON.stringify(dataToSave)
			);
		}
	}, [profileData]);

	// Calculate progress
	const progress = useMemo(
		() =>
			calculateProgress(
				{ profile: profileData, skipEventSetup },
				eventData.data,
				!!onComplete // Skip profile step if opened from events page
			),
		[profileData, skipEventSetup, eventData.data, onComplete]
	);

	// Validation for each step
	const canProceedFromStep1 = useMemo(() => {
		// If opened from events page, skip profile validation
		if (onComplete) return true;

		const { username, displayName } = profileData;
		const { ok } = validateUsername(username);
		return ok && displayName.trim().length > 0;
	}, [profileData, onComplete]);

	const canProceedFromStep2 = useMemo(() => {
		if (skipEventSetup) return true;
		const { organizerName, organizerUsername, eventCategory, profileFile } =
			eventData.data;
		const { ok } = validateUsername(organizerUsername);
		return (
			ok &&
			organizerName.trim().length > 0 &&
			eventCategory.trim().length > 0 &&
			profileFile !== null
		);
	}, [eventData.data, skipEventSetup]);

	const handleNext = () => {
		if (currentStep === 1 && canProceedFromStep1) {
			setCurrentStep(2);
		} else if (currentStep === 2 && canProceedFromStep2) {
			setCurrentStep(3);
		} else if (currentStep === 3) {
			// If opened from events page, skip auth step
			if (onComplete) {
				handleCompleteSignup();
			} else {
				setCurrentStep("auth");
			}
		}
	};

	const handleBack = () => {
		if (currentStep === 2) {
			// If opened from events page, don't go back to step 1
			if (onComplete) {
				onClose();
			} else {
				setCurrentStep(1);
			}
		} else if (currentStep === 3) {
			setCurrentStep(2);
		} else if (currentStep === "auth") {
			setCurrentStep(3);
		}
	};

	const handleSkipEventSetup = () => {
		setSkipEventSetup(true);
		// If opened from events page, close modal directly
		// Otherwise, go to auth step
		if (onComplete) {
			onClose();
		} else {
			setCurrentStep("auth");
		}
	};

	const handleCompleteSignup = async (mode?: "signup") => {
		// If called from events page (onComplete exists), don't require signup mode
		if (!onComplete && mode !== "signup") return;

		setLoading(true);
		setError(null);

		try {
			const user = auth.currentUser;
			if (!user) {
				setError("Please sign in first");
				return;
			}

			// 1. Create user profile (only for initial signup)
			if (!onComplete) {
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
					isBrand: false, // Event organizers are not brands
					brandSpaceSetupComplete: false,
					profileSetupComplete: true,
				});
			}

			// 2. Create event organizer if not skipped
			if (!skipEventSetup) {
				// Upload event organizer images
				let logoUrl: string;
				try {
					logoUrl = await uploadProfileImageCloudinary(
						eventData.data.profileFile!,
						user.uid
					);
				} catch (cloudinaryError) {
					console.warn("Event organizer logo upload failed:", cloudinaryError);
					throw new Error("Failed to upload event organizer logo");
				}

				let coverImageUrl: string | null = null;
				if (eventData.data.coverFile) {
					try {
						coverImageUrl = await uploadProfileImageCloudinary(
							eventData.data.coverFile,
							user.uid
						);
					} catch (cloudinaryError) {
						console.warn(
							"Event organizer cover upload failed:",
							cloudinaryError
						);
					}
				}

				// Create event organizer document directly in Firestore
				const eventOrganizerRef = doc(db, "eventOrganizers", user.uid);
				await setDoc(eventOrganizerRef, {
					uid: user.uid,
					organizerName: eventData.data.organizerName,
					username: eventData.data.organizerUsername,
					bio: eventData.data.bio || null,
					eventCategory: eventData.data.eventCategory || "others",
					logoUrl,
					coverImageUrl,
					baseCity: eventData.data.baseCity || null,
					activeSince: eventData.data.activeSince || null,
					email: eventData.data.email || null,
					phone: eventData.data.phone || null,
					instagram: eventData.data.instagram || null,
					tiktok: eventData.data.tiktok || null,
					twitter: eventData.data.twitter || null,
					website: eventData.data.website || null,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp(),
				});
			}

			// 3. Clear saved data and handle completion
			localStorage.removeItem("eventOnboardingProfile");
			eventData.reset();

			// If onComplete callback is provided, use it (for events page)
			// Otherwise, redirect to dashboard (for initial signup)
			if (onComplete) {
				onComplete();
			} else {
				router.push("/dashboard");
			}
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
								{currentStep === 1 && !onComplete && "Set Up Your Profile"}
								{currentStep === 2 && "Build Your Event Brand"}
								{currentStep === 3 && "Complete Your Details"}
								{currentStep === "auth" && !onComplete && "Create Your Account"}
							</h2>
							<p className="text-sm text-text-muted">
								{onComplete ? (
									// When opened from events page, only show event setup steps
									<>Step {currentStep === 2 ? 1 : 2} of 2 • Event Setup</>
								) : (
									// When opened from initial signup, show all steps
									<>
										Step {currentStep === "auth" ? "Final" : currentStep} of 3
										{!skipEventSetup &&
											currentStep !== "auth" &&
											" • Event Setup"}
										{skipEventSetup &&
											currentStep !== "auth" &&
											" • Skip Event Setup"}
									</>
								)}
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
							{!skipEventSetup &&
								progress.optionalPercent > 0 &&
								` • ${progress.optionalPercent}% Optional`}
						</span>
					</div>
					<div className="w-full bg-stroke rounded-full h-3 overflow-hidden flex">
						{/* Calculate proportional widths */}
						{(() => {
							const skipProfileStep = !!onComplete;
							const totalRequiredFields = skipProfileStep ? 0 : 3; // Profile fields
							const totalEventRequiredFields = skipEventSetup ? 0 : 4; // Event organizer required fields
							const totalOptionalFields = skipEventSetup ? 0 : 8; // Event organizer optional fields
							const totalPossibleFields =
								totalRequiredFields +
								totalEventRequiredFields +
								totalOptionalFields;

							const requiredWidth =
								totalPossibleFields > 0
									? ((totalRequiredFields + totalEventRequiredFields) /
											totalPossibleFields) *
									  100
									: 0;
							const optionalWidth =
								totalPossibleFields > 0
									? (totalOptionalFields / totalPossibleFields) * 100
									: 0;

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
									{!skipEventSetup && (
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
							<p className="text-sm text-red-700">{error}</p>
						</div>
					)}

					{loading && (
						<div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
							<p className="text-sm text-blue-700">
								Saving your information...
							</p>
						</div>
					)}

					{/* Only show profile form if NOT opened from events page */}
					{currentStep === 1 && !onComplete && (
						<ProfileForm
							value={profileData}
							onChange={setProfileData}
							isValidUsername={validateUsername(profileData.username).ok}
						/>
					)}

					{currentStep === 2 && (
						<div className="space-y-6">
							<div>
								<h3 className="font-semibold text-lg mb-2">
									Event Organizer Identity & Visuals
								</h3>
								<p className="text-text-muted text-sm mb-4">
									Set up your event organizing identity and visual elements. You
									can skip this step if you want to set up your event profile
									later.
								</p>
							</div>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								<div>
									<h4 className="font-medium mb-4">Organizer Identity</h4>
									<EventIdentityForm />
								</div>
								<div>
									<h4 className="font-medium mb-4">Visual Identity</h4>
									<EventVisualsForm />
								</div>
							</div>
						</div>
					)}

					{currentStep === 3 && (
						<div className="space-y-6">
							<div>
								<h3 className="font-semibold text-lg mb-2">
									Location & Contact Details
								</h3>
								<p className="text-text-muted text-sm mb-4">
									Help people find your events and connect with you. All fields
									are optional.
								</p>
							</div>
							<EventDetailsForm />
						</div>
					)}

					{/* Only show auth form if NOT opened from events page */}
					{currentStep === "auth" && !onComplete && (
						<AuthForm mode="signup" onSignupComplete={handleCompleteSignup} />
					)}
				</div>

				{/* Footer */}
				{currentStep !== "auth" && (
					<div className="p-6 border-t border-stroke bg-surface/50">
						<div className="flex items-center justify-between gap-4">
							{currentStep === 2 && (
								<Button
									variant="outline"
									onClick={handleSkipEventSetup}
									className="text-text-muted"
									text="Skip Event Setup"
								/>
							)}
							<div className="flex-1" />
							<Button
								onClick={handleNext}
								disabled={
									(currentStep === 1 && !canProceedFromStep1) ||
									(currentStep === 2 && !canProceedFromStep2)
								}
								text={
									currentStep === 3
										? onComplete
											? "Complete Setup"
											: "Create Account"
										: "Continue"
								}
								isLoading={currentStep === 3 && onComplete && loading}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
