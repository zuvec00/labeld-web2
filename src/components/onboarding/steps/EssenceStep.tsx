"use client";

import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";

interface EssenceStepProps {
	onNext: () => void;
	onBack: () => void;
}

const CATEGORIES = [
	"Streetwear",
	"High Fashion",
	"Vintage / Y2K",
	"Merchandise",
	"Sustainable",
	"Accessories",
	"Sneakers",
	"Art / Design",
];

export default function EssenceStep({ onNext, onBack }: EssenceStepProps) {
	const { brandCategory, bio, set } = useBrandOnboard();

	const canProceed = !!brandCategory;

	return (
		<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
			<div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
				<h2 className="text-3xl font-heading font-bold mb-2">
					Define Your Essence
				</h2>
				<p className="text-text-muted mb-8">
					Where does your brand fit in the culture?
				</p>

				<div className="space-y-8">
					{/* Category Selection */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Category
						</label>
						<div className="flex flex-wrap gap-2">
							{CATEGORIES.map((cat) => (
								<button
									key={cat}
									onClick={() =>
										set("brandCategory", brandCategory === cat ? null : cat)
									}
									className={`px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium ${
										brandCategory === cat
											? "bg-accent text-bg border-accent shadow-[0_0_15px_rgba(196,255,48,0.3)]"
											: "bg-surface border-stroke text-text-muted hover:border-text-muted hover:text-text"
									}`}
								>
									{cat}
								</button>
							))}
						</div>
					</div>

					{/* Short Positioning / Bio */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Brand Positioning{" "}
							<span className="text-xs normal-case opacity-60">(Optional)</span>
						</label>
						<textarea
							value={bio}
							onChange={(e) => set("bio", e.target.value)}
							placeholder="In a few words, what is your brand about?"
							className="w-full bg-surface border border-stroke rounded-xl p-4 outline-none focus:border-accent min-h-[100px] resize-none text-sm placeholder:text-text-muted/50 transition-colors"
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
					disabled={!canProceed}
					className="group bg-cta text-white px-8 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
				>
					Complete Setup
					<Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
				</button>
			</div>
		</div>
	);
}
