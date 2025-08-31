"use client";

import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { useMemo } from "react";

const BRAND_TYPES = [
	"Afrofusion",
	"Alt / Grunge",
	"Athleisure",
	"Casual Basics",
	"Custom / Made-to-Order",
	"Genderless / Androgynous",
	"Luxury / Designer-Inspired",
	"Minimal Street",
	"Retro / Y2K",
	"Skatewear",
	"Streetwear",
	"Sustainable / Eco-Conscious",
	"Techwear / Futuristic",
	"Thrift / Vintage",
	"Other",
];

export default function BrandIdentityForm() {
	const { brandName, brandUsername, brandCategory, set } = useBrandOnboard();

	const usernameError = useMemo(() => {
		if (!brandUsername) return undefined;
		const u = brandUsername.trim();
		if (u.length < 3 || u.length > 15)
			return "Username must be 3–15 characters";
		if (/\s/.test(u)) return "Username cannot have spaces";
		const re = /^[a-zA-Z0-9](?!.*[_.]{2})[a-zA-Z0-9._]{1,13}[a-zA-Z0-9]$/;
		return re.test(u)
			? undefined
			: "Only letters, numbers, underscores, and periods. No double special chars or starting/ending with them.";
	}, [brandUsername]);

	return (
		<div className="rounded-2xl bg-surface border border-stroke px-6 py-6">
			{/* Brand Name */}
			<div className="">
				<label className="block text-sm text-text-muted mb-1">
					Brand Name <span className="text-cta">*</span>
				</label>
				<input
					value={brandName}
					onChange={(e) => set("brandName", e.target.value)}
					placeholder="e.g The 90s Plug"
					className="w-full rounded-xl  border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
				/>
			</div>

			{/* Username */}
			<div className="mt-4">
				<label className="block text-sm text-text-muted mb-1">
					Username <span className="text-cta">*</span>
				</label>
				<input
					value={brandUsername}
					onChange={(e) => set("brandUsername", e.target.value)}
					placeholder="This is your brand’s @handle"
					className={`w-full rounded-xl  border px-4 py-3 text-text placeholder:text-text-muted outline-none ${
						usernameError ? "border-alert" : "border-stroke focus:border-accent"
					}`}
				/>
				{usernameError && (
					<p className="mt-2 text-xs text-alert">{usernameError}</p>
				)}
			</div>

			{/* Category */}
			<div className="mt-4">
				<label className="block text-sm text-text-muted mb-1">
					Brand Category <span className="text-cta">*</span>
				</label>
				<select
					value={brandCategory ?? ""}
					onChange={(e) => set("brandCategory", e.target.value || null)}
					className="w-full rounded-xl  border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
				>
					<option value="" disabled>
						Pick what fits your brand the most
					</option>
					{BRAND_TYPES.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>
			</div>
		</div>
	);
}
