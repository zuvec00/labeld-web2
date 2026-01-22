"use client";

import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { ArrowLeft, ArrowRight, Camera, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { validateUsername } from "@/lib/validation/username"; // Assume this exists or create it

interface ProfileStepProps {
	onNext: () => void;
	// Step 0 so no back usually, unless we go back to Intent?
	// But we are skipping intent.
	onBack?: () => void;
	onSkip?: () => void;
}

export default function ProfileStep({
	onNext,
	onBack,
	onSkip,
}: ProfileStepProps) {
	const { userDisplayName, userUsername, userProfileFile, set } =
		useBrandOnboard();
	const { user } = useAuth();
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Prefill if user is logged in
	useEffect(() => {
		if (user) {
			if (!userDisplayName && user.displayName)
				set("userDisplayName", user.displayName);
			// We might not have username easily unless we fetch user doc, but assumption is this is new user flow mostly.
		}
	}, [user, userDisplayName, set]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			set("userProfileFile", e.target.files[0]);
		}
	};

	const usernameValidation = validateUsername(userUsername);
	const isValid = userDisplayName.trim().length > 0 && usernameValidation.ok;

	return (
		<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
			<div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
				<h2 className="text-3xl font-heading font-bold mb-2">Set Your Label</h2>
				<p className="text-text-muted mb-8">
					Pick a username and name people will see on your profile. You can
					switch it up anytime.
				</p>

				<div className="space-y-6">
					{/* Username */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Username (@handle) <span className="text-accent">*</span>
						</label>
						<input
							type="text"
							value={userUsername}
							onChange={(e) =>
								set(
									"userUsername",
									e.target.value.toLowerCase().replace(/\s/g, ""),
								)
							}
							placeholder="yourhandle"
							className={`w-full bg-surface border rounded-xl p-4 outline-none transition-colors ${
								userUsername && !usernameValidation.ok
									? "border-red-500 focus:border-red-500"
									: "border-stroke focus:border-accent"
							}`}
						/>
						{userUsername && !usernameValidation.ok && (
							<p className="text-xs text-red-500">
								Username must be 3-15 characters, letters/numbers only
							</p>
						)}
					</div>

					{/* Display Name */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Display Name <span className="text-accent">*</span>
						</label>
						<input
							type="text"
							value={userDisplayName}
							onChange={(e) => set("userDisplayName", e.target.value)}
							placeholder="Your Name"
							className="w-full bg-surface border border-stroke rounded-xl p-4 outline-none focus:border-accent transition-colors"
						/>
					</div>

					{/* Profile Photo */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Profile Photo{" "}
							<span className="text-xs normal-case opacity-60">(Optional)</span>
						</label>

						<div
							onClick={() => fileInputRef.current?.click()}
							className="relative w-full border-2 border-dashed border-stroke hover:border-accent cursor-pointer transition-all rounded-xl p-8 flex flex-col items-center justify-center bg-surface/50 hover:bg-surface group"
						>
							{userProfileFile ? (
								<div className="relative w-24 h-24 rounded-full overflow-hidden mb-2 ring-2 ring-accent">
									<Image
										src={URL.createObjectURL(userProfileFile)}
										alt="Profile Preview"
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="w-16 h-16 rounded-full bg-surface border border-stroke flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
									<Camera className="w-6 h-6 text-text-muted group-hover:text-accent" />
								</div>
							)}

							<p className="text-sm font-medium text-text-muted group-hover:text-text transition-colors">
								{userProfileFile
									? "Change photo"
									: "This is the face of your drop."}
							</p>
							{!userProfileFile && (
								<p className="text-xs text-text-muted/60 mt-1">
									It shows on the feed and preview cards.
								</p>
							)}

							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="hidden"
							/>
						</div>
					</div>

					{/* Brand Toggle (Fixed True) */}
					<div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
						<div className="w-4 h-4 rounded bg-accent flex items-center justify-center">
							<ArrowRight className="w-3 h-3 text-bg rotate-[-45deg]" />{" "}
							{/* Checkmark-ish */}
						</div>
						<span className="text-sm text-text-muted">
							Are you a brand? (Yes)
						</span>
					</div>
				</div>
			</div>

			<div className="pt-8 flex items-center justify-between">
				<button
					onClick={onSkip}
					className="text-sm font-medium text-text-muted hover:text-text transition-colors"
				>
					Skip to Sign Up
				</button>
				<button
					onClick={onNext}
					disabled={!isValid}
					className="group bg-cta text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next Step
					<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
				</button>
			</div>
		</div>
	);
}
