"use client";

import UploadImage from "@/components/ui/upload-image";
import { useBrandOnboard } from "@/lib/stores/brandOnboard";

export default function BrandVisualsForm() {
	const { logoFile, coverFile, instagram, youtube, tiktok, set } =
		useBrandOnboard();

	return (
		<div className="rounded-2xl bg-surface border border-stroke p-6">
			{/* Logo (required) */}
			<div className="">
				<label className="block text-sm text-text-muted mb-1">
					Brand Logo <span className="text-cta">*</span>
				</label>
				<UploadImage
					value={logoFile}
					onChange={(f) => set("logoFile", f)}
					text="Upload a clean logo or image that reps your brand"
				/>
			</div>

			{/* Cover Image (optional) */}
			<div className="mt-4">
				<label className="block text-sm text-text-muted mb-1">
					Cover Image{" "}
					<span className="text-xs text-text-muted">(optional)</span>
				</label>
				<UploadImage
					backgroundColor="var(--color-calm-1)"
					value={coverFile}
					onChange={(f) => set("coverFile", f)}
					text="Set the vibe (trust me, you want to add this)"
				/>
			</div>

			<hr className="my-6 border-stroke" />

			{/* Socials */}
			<div className="grid grid-cols-1 gap-4">
				<div>
					<label className="block text-sm text-text-muted mb-1">
						Instagram{" "}
						<span className="text-xs text-text-muted">(optional)</span>
					</label>
					<input
						value={instagram}
						onChange={(e) => set("instagram", e.target.value)}
						placeholder="Instagram profile link"
						className="w-full rounded-xl bg-surface border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
					/>
				</div>
				<div>
					<label className="block text-sm text-text-muted mb-1">
						YouTube <span className="text-xs text-text-muted">(optional)</span>
					</label>
					<input
						value={youtube}
						onChange={(e) => set("youtube", e.target.value)}
						placeholder="YouTube channel link"
						className="w-full rounded-xl bg-surface border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
					/>
				</div>
				<div>
					<label className="block text-sm text-text-muted mb-1">
						TikTok <span className="text-xs text-text-muted">(optional)</span>
					</label>
					<input
						value={tiktok}
						onChange={(e) => set("tiktok", e.target.value)}
						placeholder="TikTok profile link"
						className="w-full rounded-xl bg-surface border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
					/>
				</div>
			</div>
		</div>
	);
}
