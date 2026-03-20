"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2, ChevronLeft } from "lucide-react";
import { InstagramMedia, GeneratedProduct } from "@/lib/models/instagram";
import { InstagramService } from "@/lib/firebase/functions/instagram";
import InstagramMediaSelection from "./InstagramMediaSelection";
import { useInstagramImportStore } from "@/lib/stores/instagram-import";

interface InstagramImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	brandId: string;
}

type ImportStep = "select" | "generating" | "review";

export default function InstagramImportModal({
	isOpen,
	onClose,
	brandId,
}: InstagramImportModalProps) {
	const [step, setStep] = useState<ImportStep>("select");
	const [selectedMedia, setSelectedMedia] = useState<InstagramMedia[]>([]);
	const [generatedProducts, setGeneratedProducts] = useState<
		GeneratedProduct[]
	>([]);
	const [loadingMessage, setLoadingMessage] = useState("Analyzing posts...");
	const router = useRouter();
	const { setDraftProducts } = useInstagramImportStore();

	useEffect(() => {
		if (step === "generating") {
			const messages = [
				"Analyzing posts...",
				"Extracting details...",
				"Brewing descriptions...",
				"Estimating prices...",
				"Finalizing details...",
			];
			let i = 0;
			const interval = setInterval(() => {
				i = (i + 1) % messages.length;
				setLoadingMessage(messages[i]);
			}, 2500);
			return () => clearInterval(interval);
		}
	}, [step]);

	if (!isOpen) return null;

	const handleGenerate = async (selected: InstagramMedia[]) => {
		setSelectedMedia(selected);
		setStep("generating");

		try {
			const posts = selected.map((m) => ({
				caption: m.caption || "",
				imageUrl: m.mediaUrl,
			}));

			// 1. Generate via AI
			const aiResults = await InstagramService.generateProductsFromPosts(posts);
			console.log("AI Generation Results:", aiResults);

			const parsePrice = (p: any): number => {
				if (typeof p === 'number') return p;
				if (typeof p === 'string') {
					const cleaned = p.replace(/[^0-9.]/g, '');
					const val = parseFloat(cleaned);
					return isNaN(val) ? 0 : val;
				}
				return 0;
			};

			// 2. Map to full Product model and ensure images are preserved
			const finalProducts = aiResults.map((p: any, i: number) => {
				const rawPrice = p.price ?? p.amount ?? p.cost ?? 0;
				
				return {
					id: `temp-${Date.now()}-${i}`, // Temporary ID
					brandId: brandId,
					dropName: p.name || p.title || "Untitled Product",
					description: p.description || p.caption || "",
					price: parsePrice(rawPrice),
					currency: { flag: "🇳🇬", abbreviation: "NGN", name: "Naira (NGN)", symbol: "₦" },
					mainVisualUrl: posts[i].imageUrl, // FIX: Use the original Instagram media URL
					launchDate: new Date(),
					isAvailableNow: true,
					stockMode: "global" as const,
					stockRemaining: null,
					isActive: true,
				};
			});

			setDraftProducts(finalProducts as any);
			
			// Close modal and navigate
			onClose();
			router.push("/brand-space/piece/import/instagram/review");
		} catch (err) {
			console.error("Error generating products:", err);
			setStep("select");
			// Handle error (show toast etc)
		}
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="bg-bg border border-stroke rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-stroke flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
							<h3 className="font-heading font-semibold text-lg">
								{step === "select"
									? "Select Posts"
									: "AI Import"}
							</h3>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 text-text-muted hover:text-text hover:bg-surface rounded-lg transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 min-h-0 overflow-hidden flex flex-col">
					{step === "select" && (
						<InstagramMediaSelection onGenerate={handleGenerate} />
					)}

					{step === "generating" && (
						<div className="h-full flex flex-col items-center justify-center p-12 space-y-6">
							<div className="relative">
								<div className="w-20 h-20 rounded-full border-4 border-stroke border-t-cta animate-spin" />
								<Sparkles className="absolute inset-0 m-auto w-8 h-8 text-yellow-500 animate-pulse" />
							</div>
							<div className="text-center space-y-2">
								<h4 className="text-xl font-bold animate-pulse">
									{loadingMessage}
								</h4>
								<p className="text-text-muted text-sm">
									Magic takes a moment...
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
