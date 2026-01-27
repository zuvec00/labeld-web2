"use client";

import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { ArrowRight, Image as ImageIcon, Upload } from "lucide-react"; // Renamed Image to ImageIcon
import Image from "next/image"; // Next.js Image component
import { useRef } from "react";

interface BrandVisualsStepProps {
	onNext: () => void;
	onBack: () => void;
}

export default function BrandVisualsStep({
	onNext,
	onBack,
}: BrandVisualsStepProps) {
	const { logoFile, coverFile, instagram, youtube, tiktok, set } =
		useBrandOnboard();

	const logoInputRef = useRef<HTMLInputElement>(null);
	const coverInputRef = useRef<HTMLInputElement>(null);

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			set("logoFile", e.target.files[0]);
		}
	};

	const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			set("coverFile", e.target.files[0]);
		}
	};

	return (
		<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
			<div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
				<h2 className="text-3xl font-heading font-bold mb-2">
					Visual Identity
				</h2>
				<p className="text-text-muted mb-8">
					Give your brand a face. Logo is required.
				</p>

				<div className="space-y-8">
					{/* Logo Upload */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Brand Logo <span className="text-accent">*</span>
						</label>
						<div
							onClick={() => logoInputRef.current?.click()}
							className={`relative w-32 h-32 rounded-full border-2 border-dashed ${!logoFile ? "border-accent/50 animate-pulse" : "border-stroke"} hover:border-accent cursor-pointer transition-colors flex items-center justify-center overflow-hidden bg-surface group`}
						>
							{logoFile ? (
								<Image
									src={URL.createObjectURL(logoFile)}
									alt="Logo Preview"
									fill
									className="object-cover"
								/>
							) : (
								<div className="flex flex-col items-center gap-2 text-text-muted group-hover:text-accent transition-colors">
									<ImageIcon className="w-8 h-8" />
									<span className="text-xs font-medium">Upload</span>
								</div>
							)}
							<input
								ref={logoInputRef}
								type="file"
								accept="image/*"
								onChange={handleLogoChange}
								className="hidden"
							/>
						</div>
					</div>

					{/* Cover Upload */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Cover Image
						</label>

						<div
							onClick={() => coverInputRef.current?.click()}
							className="relative w-full border-2 border-dashed border-stroke hover:border-accent cursor-pointer transition-all rounded-xl p-8 flex flex-col items-center justify-center bg-surface/50 hover:bg-surface group"
						>
							{coverFile ? (
								<div className="relative w-full h-32 rounded-lg overflow-hidden mb-2 ring-2 ring-accent">
									<Image
										src={URL.createObjectURL(coverFile)}
										alt="Cover Preview"
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="w-16 h-16 rounded-full bg-surface border border-stroke flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
									<Upload className="w-6 h-6 text-text-muted group-hover:text-accent" />
								</div>
							)}

							<p className="text-sm font-medium text-text-muted group-hover:text-text transition-colors">
								{coverFile ? "Change cover" : "Your brand’s visual identity."}
							</p>
							{!coverFile && (
								<p className="text-xs text-text-muted/60 mt-1">
									How your brand appears across Labeld.
								</p>
							)}

							<input
								ref={coverInputRef}
								type="file"
								accept="image/*"
								onChange={handleCoverChange}
								className="hidden"
							/>
						</div>
					</div>
				</div>

				{/* Socials */}
				<div className="pt-4 space-y-4 border-t border-stroke">
					<h4 className="font-medium text-sm text-text-muted uppercase tracking-wider">
						Social Links{" "}
						<span className="text-xs normal-case opacity-60">(Optional)</span>
					</h4>

					<div className="grid grid-cols-1 gap-4">
						<input
							type="text"
							value={instagram || ""}
							onChange={(e) => set("instagram", e.target.value)}
							placeholder="Instagram Profile URL"
							className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
						/>
						<input
							type="text"
							value={youtube || ""}
							onChange={(e) => set("youtube", e.target.value)}
							placeholder="YouTube Channel URL"
							className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
						/>
						<input
							type="text"
							value={tiktok || ""}
							onChange={(e) => set("tiktok", e.target.value)}
							placeholder="TikTok Profile URL"
							className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
						/>
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
					disabled={!logoFile}
					className="group bg-cta text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next Step
					<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
				</button>
			</div>
		</div>
	);
}
