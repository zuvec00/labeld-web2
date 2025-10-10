"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { uploadFileGetURL } from "@/lib/storage/upload";
import { uploadImageCloudinary } from "@/lib/storage/cloudinary";
import {
	getMerchItemById,
	updateMerchItem,
} from "@/lib/firebase/queries/merch";
import type { MerchItemDoc } from "@/lib/models/merch";
import { getAuth } from "firebase/auth";

const predefinedSizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export default function EditMerchPage() {
	const router = useRouter();
	const { eventId, merchId } = useParams<{
		eventId: string;
		merchId: string;
	}>();
	const eventIdString = eventId as string;
	const merchIdString = merchId as string;
	const auth = getAuth();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	// Form state
	const [name, setName] = useState("");
	const [price, setPrice] = useState<string>("5000");
	const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");
	const [stockMode, setStockMode] = useState<"limited" | "unlimited">(
		"limited"
	);
	const [stockTotal, setStockTotal] = useState<string>("50");
	const [sizeOptions, setSizes] = useState<string[]>([]);
	const [files, setFiles] = useState<File[]>([]);
	const [existingImages, setExistingImages] = useState<{ url: string }[]>([]);
	const [filePreviews, setFilePreviews] = useState<string[]>([]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const doc = await getMerchItemById(merchIdString);
				if (!doc) {
					setErr("Merch item not found.");
					return;
				}
				if (!mounted) return;
				setName(doc.name || "");
				setPrice(doc.priceMinor ? String(doc.priceMinor / 100) : "5000");
				setCurrency(doc.currency || "NGN");
				setStockMode(doc.stockTotal == null ? "unlimited" : "limited");
				setStockTotal(doc.stockTotal != null ? String(doc.stockTotal) : "50");
				setSizes(doc.sizeOptions || []);
				setExistingImages(doc.images || []);
			} catch (e: any) {
				setErr("Failed to load merch item.");
			} finally {
				setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [merchIdString]);

	// Handle file uploads and create previews
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(e.target.files || []);

		// Validate file count (max 5 total including existing)
		const totalImages = existingImages.length + selectedFiles.length;
		if (totalImages > 5) {
			setErr(
				`Maximum 5 images allowed. You have ${existingImages.length} existing and trying to add ${selectedFiles.length} new images.`
			);
			return;
		}

		// Create preview URLs for new files
		const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
		setFilePreviews(newPreviews);
		setFiles(selectedFiles);
		setErr(null);
	};

	// Cleanup preview URLs when component unmounts or files change
	useEffect(() => {
		return () => {
			filePreviews.forEach((url) => URL.revokeObjectURL(url));
		};
	}, [filePreviews]);

	const canSave = useMemo(() => {
		if (!name.trim()) return false;
		if (!existingImages.length && !filePreviews.length) return false;
		if (stockMode === "limited" && (!stockTotal || parseInt(stockTotal) < 1))
			return false;
		if (!price || parseInt(price) < 50) return false;
		return true;
	}, [name, existingImages, filePreviews, stockMode, stockTotal, price]);

	async function onSave() {
		const user = auth.currentUser;
		if (!user) return;
		setSaving(true);
		setErr(null);
		try {
			// Upload new images if any
			const uploaded: { url: string }[] = [];
			if (files.length) {
				for (const f of files) {
					let url: string;
					try {
						// Primary: Upload to Cloudinary
						url = await uploadImageCloudinary(f, {
							folder: `merch/${user.uid}`,
							tags: ["merch", "event", eventId],
						});
						console.log("✅ Merch image uploaded to Cloudinary:", url);
					} catch (cloudinaryError) {
						// Fallback: Upload to Firebase Storage
						console.warn(
							"⚠️ Cloudinary upload failed, falling back to Firebase Storage:",
							cloudinaryError
						);
						url = await uploadFileGetURL(
							f,
							`merch/${user.uid}/${crypto.randomUUID()}-${f.name}`
						);
						console.log("✅ Merch image uploaded to Firebase Storage:", url);
					}
					uploaded.push({ url });
				}
			}
			const images = [...existingImages, ...uploaded].slice(0, 5);

			const docIn: Partial<
				Omit<MerchItemDoc, "id" | "createdAt" | "updatedAt">
			> = {
				name,
				images,
				priceMinor: parseInt(price) * 100,
				currency,
				stockTotal: stockMode === "limited" ? parseInt(stockTotal) : null,
				stockRemaining: stockMode === "limited" ? parseInt(stockTotal) : null, // don't update remaining here
				sizeOptions: sizeOptions.length ? sizeOptions : undefined,
				// colorOptions: undefined, // not supported
			};

			// Remove undefined fields
			const cleanData = Object.fromEntries(
				Object.entries(docIn).filter(([_, value]) => value !== undefined)
			);

			await updateMerchItem(merchIdString, cleanData);
			router.push(`/events/${eventIdString}/merch`);
		} catch (e: any) {
			setErr(e?.message ?? "Failed to save changes.");
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-2xl mx-auto">
			<h1 className="font-heading font-semibold text-2xl mt-6">Edit Merch</h1>
			<p className="text-text-muted mt-1">
				Update your merch item details. Changes will be saved immediately.
			</p>
			{err && (
				<div className="mt-4 text-alert bg-alert/10 border border-alert/20 rounded-lg px-4 py-3">
					{err}
				</div>
			)}
			<div className="mt-6 flex flex-col gap-6">
				{/* Name */}
				<div>
					<label className="block text-sm text-text-muted mb-2">
						Name <span className="text-cta">*</span>
					</label>
					<input
						className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Event Tee"
					/>
				</div>

				{/* Images */}
				<div>
					<label className="block text-sm text-text-muted mb-2">
						Images <span className="text-cta">*</span>
					</label>
					<div className="flex gap-3 flex-wrap mb-2">
						{/* Existing images */}
						{existingImages.map((img, idx) => (
							<div key={img.url} className="relative group">
								<img
									src={img.url}
									className="w-20 h-20 object-cover rounded-xl border border-stroke"
									alt=""
								/>
								<button
									type="button"
									className="absolute -top-2 -right-2 bg-bg border border-stroke rounded-full w-6 h-6 flex items-center justify-center text-text-muted hover:text-text"
									onClick={() =>
										setExistingImages((prev) =>
											prev.filter((_, i) => i !== idx)
										)
									}
									title="Remove"
								>
									×
								</button>
							</div>
						))}

						{/* New file previews */}
						{filePreviews.map((preview, idx) => (
							<div key={preview} className="relative group">
								<img
									src={preview}
									className="w-20 h-20 object-cover rounded-xl border border-stroke"
									alt=""
								/>
								<button
									type="button"
									className="absolute -top-2 -right-2 bg-bg border border-stroke rounded-full w-6 h-6 flex items-center justify-center text-text-muted hover:text-text"
									onClick={() => {
										setFiles((prev) => prev.filter((_, i) => i !== idx));
										setFilePreviews((prev) => {
											URL.revokeObjectURL(prev[idx]);
											return prev.filter((_, i) => i !== idx);
										});
									}}
									title="Remove"
								>
									×
								</button>
								<div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5 rounded-b-xl">
									New
								</div>
							</div>
						))}
					</div>

					{/* Image count indicator */}
					<div className="text-xs text-text-muted mb-2">
						{existingImages.length + filePreviews.length}/5 images
					</div>

					<input
						type="file"
						multiple
						accept="image/*"
						onChange={handleFileChange}
						disabled={existingImages.length + filePreviews.length >= 5}
						className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border file:border-stroke file:bg-bg file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
					/>
					<p className="text-xs text-text-muted mt-2">
						Add 1–5 images. First image is the cover. Recommended: JPG/PNG/WebP,
						max 2MB each.
					</p>
				</div>

				{/* Price & stock */}
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<label className="block text-sm text-text-muted mb-2">
							Price <span className="text-cta">*</span>
						</label>
						<div className="flex gap-2">
							<div className="w-16 rounded-xl border border-stroke px-4 py-3 bg-surface grid place-items-center">
								₦
							</div>
							<input
								type="number"
								className="flex-1 rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								value={price}
								min={50}
								onChange={(e) => setPrice(e.target.value)}
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm text-text-muted mb-2">
							Stock mode <span className="text-cta">*</span>
						</label>
						<select
							className="w-full rounded-xl border border-stroke px-4 py-3 bg-surface text-text outline-none focus:border-accent"
							value={stockMode}
							onChange={(e) =>
								setStockMode(e.target.value as "limited" | "unlimited")
							}
						>
							<option value="limited">Limited</option>
							<option value="unlimited">Unlimited</option>
						</select>
					</div>

					{stockMode === "limited" && (
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Quantity <span className="text-cta">*</span>
							</label>
							<input
								type="number"
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								value={stockTotal}
								min={1}
								onChange={(e) => setStockTotal(e.target.value)}
							/>
						</div>
					)}
				</div>

				{/* Sizes */}
				<div>
					<label className="block text-sm text-text-muted mb-2">
						Size Options
					</label>
					<div className="flex flex-wrap gap-2 mb-2">
						{predefinedSizes.map((s) => {
							const isSelected = sizeOptions.includes(s);
							const oneSizeSelected = sizeOptions.includes("One Size");
							const isDisabled =
								(s !== "One Size" && oneSizeSelected) ||
								(s === "One Size" && sizeOptions.length > 0 && !isSelected);
							return (
								<button
									key={s}
									type="button"
									disabled={isDisabled}
									onClick={() => {
										if (s === "One Size")
											setSizes(isSelected ? [] : ["One Size"]);
										else {
											if (oneSizeSelected) return;
											setSizes((prev) =>
												isSelected ? prev.filter((x) => x !== s) : [...prev, s]
											);
										}
									}}
									className={[
										"px-3 py-1.5 rounded-full text-sm border",
										isSelected
											? "bg-text text-bg border-text"
											: "bg-surface border-stroke",
										isDisabled ? "opacity-50 cursor-not-allowed" : "",
									].join(" ")}
								>
									{s}
								</button>
							);
						})}
						{sizeOptions.length > 1 && (
							<button
								type="button"
								className="text-alert text-sm border border-alert/30 rounded-lg px-2.5"
								onClick={() => setSizes([])}
							>
								Clear All
							</button>
						)}
					</div>
					{sizeOptions.includes("One Size") && (
						<p className="text-xs text-text-muted mt-1">
							Only &quot;One Size&quot; can be selected at a time.
						</p>
					)}
					<TagInput
						label="Custom Sizes"
						value={sizeOptions}
						onChange={setSizes}
						placeholder="e.g. S, M, L, XL ..."
					/>
				</div>
			</div>

			<div className="mt-8 flex items-center justify-between">
				<Button
					text="Cancel"
					variant="outline"
					onClick={() => router.push(`/events/${eventIdString}/merch`)}
					outlineColor="text-text-muted"
				/>
				<Button
					text={saving ? "Saving…" : "Save Changes"}
					variant={canSave && !err ? "primary" : "disabled"}
					disabled={!canSave || saving || !!err}
					onClick={onSave}
				/>
			</div>
		</div>
	);
}

// --- TagInput component (copied from create page) ---
function TagInput({
	label,
	value,
	onChange,
	placeholder,
}: {
	label: string;
	value: string[];
	onChange: (v: string[]) => void;
	placeholder: string;
}) {
	const [input, setInput] = useState("");
	return (
		<div>
			<label className="block text-sm text-text-muted mb-2">{label}</label>
			<div className="flex gap-2">
				<input
					className="flex-1 rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
					value={input}
					placeholder={placeholder}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							const t = input.trim();
							if (t && !value.includes(t)) onChange([...value, t]);
							setInput("");
						}
					}}
				/>
				<Button
					variant="outline"
					text="Add"
					onClick={() => {
						const t = input.trim();
						if (t && !value.includes(t)) onChange([...value, t]);
						setInput("");
					}}
				/>
			</div>
			{!!value.length && (
				<div className="flex flex-wrap gap-2 mt-2">
					{value.map((v) => (
						<span
							key={v}
							className="inline-flex items-center gap-2 bg-surface border border-stroke px-3 py-1.5 rounded-full text-sm"
						>
							{v}
							<button
								className="text-text-muted hover:text-text"
								onClick={() => onChange(value.filter((x) => x !== v))}
							>
								×
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	);
}
