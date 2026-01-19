"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
	X,
	CheckCircle2,
	ChevronRight,
	MessageSquareHeart,
} from "lucide-react";
import Button from "@/components/ui/button";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { useDashboardContext } from "@/hooks/useDashboardContext";

interface SurveyOption {
	id: string;
	label: string;
	icon?: string;
	hasSubOptions?: boolean;
	subOptions?: { id: string; label: string }[];
	requiresDetail?: boolean;
	detailPlaceholder?: string;
}

const SURVEY_OPTIONS: SurveyOption[] = [
	{
		id: "instagram_ads",
		label: "Instagram Ads",
		icon: "📸",
		hasSubOptions: true,
		subOptions: [
			{ id: "image_ads", label: "Image Ads" },
			{ id: "video_ads", label: "Video Ads" },
		],
	},
	{
		id: "snapchat_ads",
		label: "Snapchat Influencer Ads",
		icon: "👻",
	},
	{
		id: "referral",
		label: "Referral from a friend/person",
		icon: "👥",
		requiresDetail: true,
		detailPlaceholder: "Who referred you? (Optional)",
	},
	{
		id: "tiktok",
		label: "TikTok",
		icon: "🎵",
	},
	{
		id: "other",
		label: "Other",
		icon: "🔗",
		requiresDetail: true,
		detailPlaceholder: "Please specify...",
	},
];

interface AcquisitionSurveyModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function AcquisitionSurveyModal({
	isOpen,
	onClose,
}: AcquisitionSurveyModalProps) {
	const { user, activeRole } = useDashboardContext();
	const [step, setStep] = useState<"main" | "sub" | "detail">("main");
	const [selectedOption, setSelectedOption] = useState<SurveyOption | null>(
		null
	);
	const [subSelection, setSubSelection] = useState<string | null>(null);
	const [detailInput, setDetailInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!isOpen || !user || activeRole !== "brand") return null;

	const handleOptionSelect = (option: SurveyOption) => {
		setSelectedOption(option);
		if (option.hasSubOptions) {
			setStep("sub");
		} else if (option.requiresDetail) {
			setStep("detail");
		} else {
			// Ready to submit? Or show "Submit" button?
			// Let's keep it simple: Select -> Show Submit at bottom
		}
	};

	const handleSubmit = async (skipped = false) => {
		if (!user?.uid) return;
		setIsSubmitting(true);

		try {
			const brandRef = doc(db, "users", user.uid);

			const payload = {
				acquisitionSurvey: skipped
					? { skipped: true, respondedAt: new Date() }
					: {
							source: selectedOption?.id || "unknown",
							subSource: subSelection || null,
							otherDetail: detailInput || null,
							skipped: false,
							respondedAt: new Date(),
					  },
			};

			await updateDoc(brandRef, payload);
			onClose();
		} catch (error) {
			console.error("Failed to save survey:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const canSubmit =
		selectedOption &&
		(!selectedOption.hasSubOptions || subSelection) &&
		(!selectedOption.requiresDetail || true); // Detail is optional mostly, or enforced? User said "it's not by force to answer"

	// Render helpers
	const renderContent = () => {
		if (step === "main") {
			return (
				<div className="space-y-3">
					{SURVEY_OPTIONS.map((opt) => (
						<button
							key={opt.id}
							onClick={() => handleOptionSelect(opt)}
							className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
								selectedOption?.id === opt.id
									? "border-accent bg-accent/5 ring-1 ring-accent"
									: "border-stroke hover:border-text-muted/50 hover:bg-surface"
							}`}
						>
							<div className="flex items-center gap-3 text-left">
								<span className="text-lg md:text-xl flex-shrink-0">
									{opt.icon}
								</span>
								<span className="font-medium text-text">{opt.label}</span>
							</div>
							{selectedOption?.id === opt.id && (
								<CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
							)}
						</button>
					))}
				</div>
			);
		}

		if (step === "sub") {
			return (
				<div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
					<button
						onClick={() => setStep("main")}
						className="text-sm text-text-muted hover:text-text flex items-center gap-1 mb-2"
					>
						← Back
					</button>
					<h4 className="font-medium text-lg">
						How did you see us on {selectedOption?.label}?
					</h4>
					<div className="space-y-3">
						{selectedOption?.subOptions?.map((sub) => (
							<button
								key={sub.id}
								onClick={() => setSubSelection(sub.id)}
								className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
									subSelection === sub.id
										? "border-accent bg-accent/5 ring-1 ring-accent"
										: "border-stroke hover:border-text-muted/50 hover:bg-surface"
								}`}
							>
								<span className="font-medium text-text text-left">
									{sub.label}
								</span>
								{subSelection === sub.id && (
									<CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
								)}
							</button>
						))}
					</div>
				</div>
			);
		}

		if (step === "detail") {
			return (
				<div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
					<button
						onClick={() => {
							setStep("main");
							setDetailInput("");
						}}
						className="text-sm text-text-muted hover:text-text flex items-center gap-1 mb-2"
					>
						← Back
					</button>
					<h4 className="font-medium text-lg">
						{selectedOption?.label} details
					</h4>
					<input
						autoFocus
						className="w-full p-3 rounded-xl border border-stroke bg-surface focus:border-accent outline-none transition-colors text-base"
						placeholder={selectedOption?.detailPlaceholder}
						value={detailInput}
						onChange={(e) => setDetailInput(e.target.value)}
					/>
				</div>
			);
		}
	};

	return createPortal(
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

			<div className="relative w-full max-w-md bg-bg border border-stroke rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="p-6 pb-2">
					<div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4 text-accent">
						<MessageSquareHeart className="w-6 h-6" />
					</div>
					<h2 className="text-xl md:text-2xl font-heading font-semibold mb-2">
						Where did you hear about us?
					</h2>
					<p className="text-text-muted text-sm leading-relaxed">
						Your feedback helps us reach more amazing brands like yours. This
						quick question helps us improve Labeld.
					</p>
				</div>

				{/* Body */}
				<div className="p-6 pt-4 flex-1 overflow-y-auto">{renderContent()}</div>

				{/* Footer */}
				<div className="p-4 border-t border-stroke bg-surface/50 flex items-center justify-between">
					<button
						onClick={() => handleSubmit(true)}
						className="text-sm text-text-muted hover:text-text px-4 py-2"
						disabled={isSubmitting}
					>
						Skip
					</button>

					<Button
						text="Submit Feedback"
						isLoading={isSubmitting}
						loadingText="Saving..."
						disabled={!canSubmit}
						onClick={() => handleSubmit(false)}
						className="min-w-[120px]"
					/>
				</div>
			</div>
		</div>,
		document.body
	);
}
