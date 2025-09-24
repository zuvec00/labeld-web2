/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { uploadContentImageWeb } from "@/lib/storage/upload";
import { addDropContentCF } from "@/lib/firebase/callables/dropContent";
import { fetchBrandById } from "@/lib/firebase/queries/brandspace";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface RadarPromotionPopupProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	pieceData: {
		id: string;
		dropName: string;
		mainVisualUrl: string;
		styleTags?: string[] | null;
		dropId?: string | null;
		launchDate?: string;
	};
}

export default function RadarPromotionPopup({
	isOpen,
	onClose,
	onSuccess,
	pieceData,
}: RadarPromotionPopupProps) {
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	// Form fields
	const [momentName, setMomentName] = useState("");
	const [momentDescription, setMomentDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");

	// Initialize form with piece data
	useEffect(() => {
		if (isOpen && pieceData) {
			setMomentName(pieceData.dropName || "");
			setTags(pieceData.styleTags || []);
			setMomentDescription("");
			setTagInput("");
			setErr(null);
		}
	}, [isOpen, pieceData]);

	function serializeBrandForContent(b: any) {
		if (!b) return null;
		const maybeISO = (v: any) =>
			v instanceof Date
				? v.toISOString()
				: typeof v?.toDate === "function"
				? v.toDate().toISOString()
				: typeof v === "string"
				? v
				: null;

		const out = {
			uid: b.uid,
			brandName: b.brandName,
			username: b.username,
			bio: b.bio ?? null,
			category: b.category ?? null,
			brandTags: Array.isArray(b.brandTags) ? b.brandTags : [],
			logoUrl: b.logoUrl ?? null,
			coverImageUrl: b.coverImageUrl ?? null,
			country: b.country ?? null,
			state: b.state ?? null,
			instagram: b.instagram ?? null,
			youtube: b.youtube ?? null,
			tiktok: b.tiktok ?? null,
			heat: typeof b.heat === "number" ? b.heat : 0,
			createdAt: maybeISO(b.createdAt),
			updatedAt: maybeISO(b.updatedAt),
		};
		Object.keys(out).forEach(
			(k) => (out as any)[k] == null && delete (out as any)[k]
		);
		return out;
	}

	// Tag helpers
	const addTag = () => {
		const t = tagInput.trim();
		if (!t) return;
		if (tags.includes(t)) return;
		setTags((prev) => [...prev, t]);
		setTagInput("");
	};
	const removeTag = (t: string) =>
		setTags((prev) => prev.filter((x) => x !== t));

	async function onPromoteToRadar() {
		setSaving(true);
		setErr(null);
		try {
			// 1) Get current user ID (brand ID)
			const auth = getAuth();
			const uid = auth.currentUser?.uid;
			if (!uid) throw new Error("User not authenticated");

			// 2) Fetch brand data for denormalization (same as radar/new)
			const brand = await fetchBrandById(uid);
			const brandMap = serializeBrandForContent(brand);

			// 3) Construct content payload (matching radar/new structure exactly)
			const contentData: Record<string, any> = {
				brandId: uid, // brand == current user
				userId: uid,
				dropId: pieceData.dropId ?? null, // Use dropId from piece data
				dropProductId: pieceData.id, // This should be the product ID from addDropProductCF
				launchDate: pieceData.launchDate || new Date().toISOString(),
				teaserImageUrl: pieceData.mainVisualUrl, // Use the piece's main image
				momentName: momentName || null,
				momentDescription: momentDescription || null,
				tags: tags.length ? tags : null,
				isDeleted: false,
				isPublished: false,
				visibility: "public",
				heatScore: 0,
				mediaType: "image",
				contentLinkUrl: null,
				reactions: { "🔥": 0, "🥶": 0, "😮‍💨": 0, "🫶": 0 },
				// ⭐ DENORMALIZED BRAND SNAPSHOT (parity with Flutter's brand.toMap())
				brand: brandMap,
			};
			Object.keys(contentData).forEach(
				(k) => contentData[k] == null && delete contentData[k]
			);

			// Debug: Log the content data to see what we're sending
			console.log("Creating radar content with data:", {
				dropProductId: contentData.dropProductId,
				pieceDataId: pieceData.id,
				dropId: contentData.dropId,
				launchDate: contentData.launchDate,
				contentData,
			});

			// 4) Create radar content (same as radar/new)
			const newId = await addDropContentCF(contentData);
			console.log("Created radar content with ID:", newId);

			// 5) Success
			onSuccess();
		} catch (e: any) {
			console.error("Failed to promote to radar:", e);
			setErr(e?.message ?? "Failed to promote to radar.");
		} finally {
			setSaving(false);
		}
	}

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-bg rounded-3xl border border-stroke shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="p-6 border-b border-stroke">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="font-heading font-semibold text-xl">
								Push to Radar 🚀
							</h2>
							<p className="text-text-muted text-sm mt-1">
								Get your piece in front of your audience
							</p>
						</div>
						<button
							onClick={onClose}
							className="w-8 h-8 rounded-full bg-surface border border-stroke flex items-center justify-center hover:bg-bg transition-colors"
						>
							×
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Preview */}
					<div className="rounded-2xl bg-surface border border-stroke p-4">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-2 h-2 bg-accent rounded-full"></div>
							<span className="text-sm font-medium text-text">Preview</span>
						</div>
						<div className="flex gap-4">
							<img
								src={pieceData.mainVisualUrl}
								alt="Piece preview"
								className="w-20 h-20 rounded-xl object-cover border border-stroke"
							/>
							<div className="flex-1">
								<h3 className="font-medium text-text">
									{momentName || pieceData.dropName}
								</h3>
								<p className="text-text-muted text-sm mt-1">
									{momentDescription ||
										"Ready to drop this piece to your audience"}
								</p>
								{tags.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-2">
										{tags.slice(0, 3).map((tag) => (
											<span
												key={tag}
												className="text-xs bg-surface border border-stroke px-2 py-1 rounded-full"
											>
												#{tag}
											</span>
										))}
										{tags.length > 3 && (
											<span className="text-xs text-text-muted">
												+{tags.length - 3} more
											</span>
										)}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Form Fields */}
					<div className="space-y-4">
						{/* Moment Title */}
						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Moment Title
							</label>
							<input
								value={momentName}
								onChange={(e) => setMomentName(e.target.value)}
								placeholder="Give this moment a catchy title"
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface"
							/>
						</div>

						{/* Moment Description */}
						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Description
							</label>
							<textarea
								value={momentDescription}
								onChange={(e) => setMomentDescription(e.target.value)}
								placeholder="Tell the story behind this piece..."
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface min-h-[100px] resize-none"
							/>
						</div>

						{/* Tags */}
						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Tags
							</label>
							<div className="flex gap-2">
								<input
									value={tagInput}
									onChange={(e) => setTagInput(e.target.value)}
									onKeyDown={(e) =>
										e.key === "Enter" && (e.preventDefault(), addTag())
									}
									placeholder="Add a tag and press Enter"
									className="flex-1 rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface"
								/>
								<button
									type="button"
									onClick={addTag}
									className="rounded-xl bg-accent text-bg px-4 py-3 font-semibold hover:bg-accent/90 transition-colors"
								>
									Add
								</button>
							</div>

							{!!tags.length && (
								<div className="flex flex-wrap gap-2 mt-3">
									{tags.map((t) => (
										<span
											key={t}
											className="inline-flex items-center gap-2 bg-surface border border-stroke px-3 py-1.5 rounded-full"
										>
											#{t}
											<button
												onClick={() => removeTag(t)}
												className="text-text-muted hover:text-text transition-colors"
											>
												×
											</button>
										</span>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Error */}
					{err && (
						<div className="bg-alert/10 text-alert px-4 py-3 rounded-xl border border-alert/20">
							{err}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-stroke">
					<div className="flex items-center justify-between gap-3">
						<Button
							text="Skip for now"
							variant="outline"
							outlineColor="text-text-muted"
							onClick={onClose}
							disabled={saving}
						/>
						<Button
							text={saving ? "Pushing to Radar..." : "Push to Radar 🚀"}
							variant="primary"
							onClick={onPromoteToRadar}
							disabled={saving}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
