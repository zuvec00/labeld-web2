"use client";

import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { ArrowRight, Camera, Check, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { validateUsername } from "@/lib/validation/username";
import { useUsernameAvailability } from "@/lib/hooks/useUsernameAvailability";

interface ProfileStepProps {
	onNext: () => void;
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
	const userEditedUsername = useRef(userUsername.length > 0);

	// Prefill display name from auth if not yet set
	useEffect(() => {
		if (user) {
			if (!userDisplayName && user.displayName)
				set("userDisplayName", user.displayName);
		}
	}, [user, userDisplayName, set]);

	// Auto-generate username from display name (mirrors mobile: firstName + userCount)
	// We skip the count lookup for simplicity — just slugify the display name.
	useEffect(() => {
		if (userEditedUsername.current) return;
		if (!userDisplayName.trim()) return;
		const base = userDisplayName
			.trim()
			.split(" ")[0]
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "");
		if (base.length >= 3) set("userUsername", base);
	}, [userDisplayName]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		userEditedUsername.current = true;
		set("userUsername", e.target.value.toLowerCase().replace(/\s/g, ""));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			set("userProfileFile", e.target.files[0]);
		}
	};

	const { ok: formatOk } = validateUsername(userUsername);
	const availabilityStatus = useUsernameAvailability(userUsername, {
		type: "user",
	});

	const isChecking = availabilityStatus === "checking";
	const isAvailable = availabilityStatus === "available";
	const isTaken = availabilityStatus === "taken";

	const formatError =
		userUsername && !formatOk
			? "3–15 chars, letters/numbers/._  only, no consecutive special chars"
			: null;

	const isValid =
		userDisplayName.trim().length > 0 &&
		formatOk &&
		isAvailable &&
		!isChecking;

	return (
		<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
			<div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
				<h2 className="text-3xl font-heading font-bold mb-2">Set Your Label</h2>
				<p className="text-text-muted mb-8">
					Pick a username and name people will see on your profile. You can
					switch it up anytime.
				</p>

				<div className="space-y-6">
					{/* Display Name */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Display Name <span className="text-accent">*</span>
						</label>
						<input
							type="text"
							value={userDisplayName}
							autoFocus
							onChange={(e) => set("userDisplayName", e.target.value)}
							placeholder="Your Name"
							className="w-full bg-surface border border-stroke rounded-xl p-4 outline-none focus:border-accent transition-colors"
						/>
					</div>

					{/* Username */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Username (@handle) <span className="text-accent">*</span>
						</label>
						<div className="relative">
							<input
								type="text"
								value={userUsername}
								onChange={handleUsernameChange}
								placeholder="yourhandle"
								className={`w-full bg-surface border rounded-xl p-4 pr-10 outline-none transition-colors ${
									formatError || isTaken
										? "border-red-500 focus:border-red-500"
										: isAvailable
										? "border-green-500 focus:border-green-500"
										: "border-stroke focus:border-accent"
								}`}
							/>
							<div className="absolute right-3 top-1/2 -translate-y-1/2">
								{isChecking && (
									<Loader2 className="w-4 h-4 text-text-muted animate-spin" />
								)}
								{isAvailable && !isChecking && (
									<Check className="w-4 h-4 text-green-500" />
								)}
								{(formatError || isTaken) && !isChecking && userUsername && (
									<X className="w-4 h-4 text-red-500" />
								)}
							</div>
						</div>
						{formatError && (
							<p className="text-xs text-red-500">{formatError}</p>
						)}
						{isTaken && !formatError && (
							<p className="text-xs text-red-500">
								Username is already taken. Try another.
							</p>
						)}
						{isAvailable && !formatError && (
							<p className="text-xs text-green-500">Username available!</p>
						)}
						{isChecking && (
							<p className="text-xs text-text-muted">Checking availability…</p>
						)}
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
								{userProfileFile ? "Change photo" : "This is the face of your drop."}
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
							<ArrowRight className="w-3 h-3 text-bg rotate-[-45deg]" />
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
