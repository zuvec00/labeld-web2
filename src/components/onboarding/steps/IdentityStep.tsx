"use client";

import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { validateUsername } from "@/lib/validation/username";
import { ArrowRight, Check, X } from "lucide-react";
import { useState, useEffect } from "react";

interface IdentityStepProps {
	onNext: () => void;
	onBack: () => void;
}

export default function IdentityStep({ onNext, onBack }: IdentityStepProps) {
	const { brandName, brandUsername, brandCategory, set } = useBrandOnboard();

	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [isValidating, setIsValidating] = useState(false);

	useEffect(() => {
		if (brandUsername) {
			const { ok } = validateUsername(brandUsername);
			if (!ok) {
				let msg = "Invalid username";
				if (brandUsername.length < 3) msg = "Too short (min 3 chars)";
				else if (brandUsername.length > 15) msg = "Too long (max 15 chars)";
				else if (/\s/.test(brandUsername)) msg = "No spaces allowed";
				else
					msg =
						"Use letters, numbers, . or _ only (no consecutive special chars)";
				setUsernameError(msg);
			} else {
				setUsernameError(null);
			}
		} else {
			setUsernameError(null);
		}
	}, [brandUsername]);

	const canProceed =
		brandName.trim().length > 0 &&
		brandUsername.trim().length > 0 &&
		brandCategory !== null &&
		!usernameError;

	return (
		<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
			<div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
				<h2 className="text-3xl font-heading font-bold mb-2">
					Claim Your Identity
				</h2>
				<p className="text-text-muted mb-8">
					This is how the culture will know you.
				</p>

				<div className="space-y-6">
					{/* Brand Name */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Display Name <span className="text-accent">*</span>
						</label>
						<input
							type="text"
							value={brandName}
							autoFocus
							onChange={(e) => set("brandName", e.target.value)}
							placeholder="e.g. Broken Planet"
							className="w-full bg-transparent border-b-2 border-stroke focus:border-accent text-3xl font-heading font-semibold py-2 outline-none placeholder:text-subtle transition-colors"
						/>
					</div>

					{/* Username */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Handle <span className="text-accent">*</span>
						</label>
						<div className="relative">
							<span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl text-text-muted font-medium">
								@
							</span>
							<input
								type="text"
								value={brandUsername}
								onChange={(e) =>
									set("brandUsername", e.target.value.toLowerCase().trim())
								}
								placeholder="brokenplanet"
								className={`w-full bg-transparent border-b-2 ${
									usernameError
										? "border-red-500/50 focus:border-red-500"
										: "border-stroke focus:border-accent"
								} text-2xl font-medium py-2 pl-8 outline-none placeholder:text-subtle transition-colors`}
							/>
							<div className="absolute right-0 top-1/2 -translate-y-1/2">
								{brandUsername && !usernameError && (
									<div className="text-green-500 animate-in zoom-in duration-200">
										<Check className="w-5 h-5" />
									</div>
								)}
								{usernameError && (
									<div className="text-red-500 animate-in zoom-in duration-200">
										<X className="w-5 h-5" />
									</div>
								)}
							</div>
						</div>
						{usernameError && (
							<p className="text-sm text-red-500 animate-in slide-in-from-top-1">
								{usernameError}
							</p>
						)}
						<p className="text-xs text-text-muted">
							You can change this later, but it's good to secure it now.
						</p>
					</div>

					{/* Brand Category */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Brand Category <span className="text-accent">*</span>
						</label>
						<select
							value={brandCategory || ""}
							onChange={(e) => set("brandCategory", e.target.value)}
							className="w-full bg-surface border-b-2 border-stroke focus:border-accent font-medium py-3 outline-none transition-colors appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNoZXZyb24tZG93biI+PHBhdGggZD0ibTYgOSA2IDYgNi02Ii8+PC9zdmc+')] bg-no-repeat bg-[right_0px_center] bg-[length:20px_20px]"
						>
							<option value="" disabled>
								Pick what fits your brand the most
							</option>
							<option value="Afrofusion">Afrofusion</option>
							<option value="Alt / Grunge">Alt / Grunge</option>
							<option value="Athleisure">Athleisure</option>
							<option value="Casual Basics">Casual Basics</option>
							<option value="Custom / Made-to-Order">
								Custom / Made-to-Order
							</option>
							<option value="Genderless / Androgynous">
								Genderless / Androgynous
							</option>
							<option value="Luxury / Designer-Inspired">
								Luxury / Designer-Inspired
							</option>
							<option value="Minimal Street">Minimal Street</option>
							<option value="Retro / Y2K">Retro / Y2K</option>
							<option value="Skatewear">Skatewear</option>
							<option value="Streetwear">Streetwear</option>
							<option value="Sustainable / Eco-Conscious">
								Sustainable / Eco-Conscious
							</option>
							<option value="Techwear / Futuristic">
								Techwear / Futuristic
							</option>
							<option value="Thrift / Vintage">Thrift / Vintage</option>
							<option value="Other">Other</option>
						</select>
					</div>
				</div>
			</div>

			<div className="pt-8 flex items-center justify-between">
				<button
					onClick={onBack}
					className="text-text-muted hover:text-text transition-colors px-4 py-2"
				>
					Back
				</button>
				<button
					onClick={onNext}
					disabled={!canProceed}
					className="group bg-cta text-white px-8 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
				>
					Next Step
					<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
				</button>
			</div>
		</div>
	);
}
