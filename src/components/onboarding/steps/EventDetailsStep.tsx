"use client";

import { useEventOrganizerOnboard } from "@/lib/stores/eventOrganizerStore";
import { ArrowRight, Sparkles } from "lucide-react";

interface EventDetailsStepProps {
	onNext: () => void;
	onBack: () => void;
}

const EVENT_CATEGORIES = [
	"Nightlife",
	"Concerts",
	"Festivals",
	"Pop-ups",
	"Workshops",
	"Community",
	"Markets",
	"Exhibitions",
];

export default function EventDetailsStep({
	onNext,
	onBack,
}: EventDetailsStepProps) {
	const { data, setData } = useEventOrganizerOnboard();
	const {
		eventCategory,
		baseCity,
		activeSince,
		bio,
		website,
		instagram,
		tiktok,
		twitter,
		email,
		phone,
	} = data;

	const canProceed = !!eventCategory;

	return (
		<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
			<div className="flex-1 flex flex-col justify-start max-w-md mx-auto w-full overflow-y-auto pr-2">
				<h2 className="text-3xl font-heading font-bold mb-2">
					Experience Details
				</h2>
				<p className="text-text-muted mb-8">
					Tell us more about the vibes you're curating.
				</p>

				<div className="space-y-8 pb-8">
					{/* Category Selection */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Category (Required)
						</label>
						<div className="flex flex-wrap gap-2">
							{EVENT_CATEGORIES.map((cat) => (
								<button
									key={cat}
									onClick={() =>
										setData({ eventCategory: eventCategory === cat ? "" : cat })
									}
									className={`px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium ${
										eventCategory === cat
											? "bg-accent text-bg border-accent shadow-[0_0_15px_rgba(196,255,48,0.3)]"
											: "bg-surface border-stroke text-text-muted hover:border-text-muted hover:text-text"
									}`}
								>
									{cat}
								</button>
							))}
						</div>
					</div>

					{/* Bio */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Short Bio
						</label>
						<textarea
							value={bio || ""}
							onChange={(e) => setData({ bio: e.target.value })}
							placeholder="What makes your events special?"
							className="w-full bg-surface border border-stroke rounded-xl p-4 outline-none focus:border-accent text-sm placeholder:text-text-muted/50 transition-colors min-h-[100px] resize-none"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						{/* Base City */}
						<div className="space-y-2">
							<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
								Base City
							</label>
							<input
								type="text"
								value={baseCity || ""}
								onChange={(e) => setData({ baseCity: e.target.value })}
								placeholder="London"
								className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
							/>
						</div>
						{/* Active Since */}
						<div className="space-y-2">
							<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
								Active Since
							</label>
							<input
								type="text"
								value={activeSince || ""}
								onChange={(e) => setData({ activeSince: e.target.value })}
								placeholder="2023"
								className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
							/>
						</div>
					</div>

					{/* Contact & Socials */}
					<div className="space-y-4 pt-4 border-t border-stroke/50">
						<h4 className="font-medium">Links & Contact (Optional)</h4>

						<div className="grid grid-cols-1 gap-4">
							<input
								type="url"
								value={website || ""}
								onChange={(e) => setData({ website: e.target.value })}
								placeholder="Website URL"
								className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
							/>
							<div className="grid grid-cols-2 gap-4">
								<input
									type="text"
									value={instagram || ""}
									onChange={(e) => setData({ instagram: e.target.value })}
									placeholder="Instagram @"
									className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
								/>
								<input
									type="text"
									value={tiktok || ""}
									onChange={(e) => setData({ tiktok: e.target.value })}
									placeholder="TikTok @"
									className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<input
									type="email"
									value={email || ""}
									onChange={(e) => setData({ email: e.target.value })}
									placeholder="Contact Email"
									className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
								/>
								<input
									type="tel"
									value={phone || ""}
									onChange={(e) => setData({ phone: e.target.value })}
									placeholder="Phone Number"
									className="w-full bg-surface border border-stroke rounded-xl p-3 outline-none focus:border-accent text-sm transition-colors"
								/>
							</div>
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
