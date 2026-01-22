"use client";

import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import locationData from "@/data/countries_and_states.json";

interface BrandDetailsStepProps {
	onNext: () => void;
	onBack: () => void;
}

export default function BrandDetailsStep({
	onNext,
	onBack,
}: BrandDetailsStepProps) {
	const { bio, country, state, tags, set } = useBrandOnboard();

	// Simplified tag handling
	const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			const val = e.currentTarget.value.trim();
			if (val && tags.length < 3 && !tags.includes(val)) {
				set("tags", [...tags, val]);
				e.currentTarget.value = "";
			}
		}
	};

	const removeTag = (tag: string) => {
		set(
			"tags",
			tags.filter((t) => t !== tag),
		);
	};

	const states = useMemo(() => {
		if (!country) return [];
		const c = locationData.data.find((c: any) => c.name === country);
		return c?.states || [];
	}, [country]);

	return (
		<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
			<div className="flex-1 flex flex-col justify-start max-w-md mx-auto w-full overflow-y-auto pr-2">
				<h2 className="text-3xl font-heading font-bold mb-2">
					Brand Story & Location
				</h2>
				<p className="text-text-muted mb-8">
					Add more details about your brand to complete your profile.
				</p>

				<div className="space-y-8 pb-8">
					{/* Bio */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Bio / Tagline{" "}
							<span className="text-xs normal-case opacity-60">(Max 120)</span>
						</label>
						<textarea
							value={bio || ""}
							onChange={(e) => set("bio", e.target.value.slice(0, 120))}
							placeholder="Keep it short & punchy..."
							className="w-full bg-surface border border-stroke rounded-xl p-4 outline-none focus:border-accent text-sm placeholder:text-text-muted/50 transition-colors min-h-[100px] resize-none"
						/>
						<div className="flex justify-end text-xs text-text-muted">
							{bio?.length || 0}/120
						</div>
					</div>

					{/* Tags */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Brand Tags{" "}
							<span className="text-xs normal-case opacity-60">(Up to 3)</span>
						</label>
						<div className="flex flex-wrap gap-2 mb-2">
							{tags.map((tag) => (
								<span
									key={tag}
									className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full flex items-center gap-1"
								>
									{tag}
									<button
										onClick={() => removeTag(tag)}
										className="hover:text-white"
									>
										&times;
									</button>
								</span>
							))}
						</div>
						{tags.length < 3 && (
							<input
								type="text"
								onKeyDown={handleTagKeyDown}
								placeholder="Add a tag and press Enter"
								className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
							/>
						)}
					</div>

					{/* Location */}
					<div className="space-y-4 pt-4 border-t border-stroke">
						<h4 className="font-medium">Brand Location</h4>

						<div className="space-y-2">
							<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
								Country
							</label>
							<select
								value={country || ""}
								onChange={(e) => {
									set("country", e.target.value);
									set("state", null); // Reset state when country changes
								}}
								className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors appearance-none"
							>
								<option value="">Select Country</option>
								{locationData.data.map((c: any, index: number) => (
									<option key={`${c.name}-${index}`} value={c.name}>
										{c.name}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
								State
							</label>
							<select
								value={state || ""}
								onChange={(e) => set("state", e.target.value)}
								disabled={!country}
								className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors appearance-none disabled:opacity-50"
							>
								<option value="">Select State</option>
								{states.map((s: any) => (
									<option key={s.name} value={s.name}>
										{s.name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</div>

			<div className="pt-4 pb-2 flex items-center justify-between bg-bg border-t border-stroke mt-auto">
				<button
					onClick={onBack}
					className="text-text-muted hover:text-text transition-colors px-4 py-2"
				>
					Back
				</button>
				<button
					onClick={onNext}
					className="group bg-cta text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
				>
					Next Step
					<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
				</button>
			</div>
		</div>
	);
}
