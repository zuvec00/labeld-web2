"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { formatWithCommasDouble, getCurrencyFromMap } from "@/lib/format";
import {
	fetchProductById,
	updateDropProduct,
	type Product,
	deleteDropProduct,
} from "@/lib/firebase/queries/product";
import { getCollectionListForBrand } from "@/lib/firebase/queries/collection";
import { uploadFileGetURL } from "@/lib/storage/upload";
import {
	uploadImageCloudinary,
	uploadFileDirectCloudinary,
} from "@/lib/storage/cloudinary";
import { useUploadStore } from "@/lib/stores/upload";

/* ----------------------------- Currency source ---------------------------- */

const currencyList: Array<{
	flag: string;
	abbreviation: string;
	name: string;
}> = [
	{ flag: "🇳🇬", abbreviation: "NGN", name: "Naira (NGN)" },
	{ flag: "🇺🇸", abbreviation: "USD", name: "US Dollar (USD)" },
	{ flag: "🇬🇧", abbreviation: "GBP", name: "Pound Sterling (GBP)" },
	{ flag: "🇪🇺", abbreviation: "EUR", name: "Euro (EUR)" },
];

/* --------------------------------- Utils --------------------------------- */

function asDate(v: any): Date | null {
	if (!v) return null;
	if (v instanceof Date) return v;
	if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
	if (typeof v === "string") {
		const d = new Date(v);
		return isNaN(+d) ? null : d;
	}
	return null;
}

type UploadState = {
	file: File | null; // null if existing
	previewUrl: string;
	uploadId?: string;
	uploadedUrl?: string; // Set when complete or for existing
	status: "pending" | "uploading" | "completed" | "error";
	error?: string;
};

/* ---------------------------------- Page --------------------------------- */

export default function EditPiecePage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const auth = getAuth(); // Used for upload

	const { addUpload, updateUpload, removeUpload } = useUploadStore();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const [product, setProduct] = useState<Product | null>(null);
	const [collections, setCollections] = useState<
		Array<{ id: string; name: string; launchDate?: Date | null }>
	>([]);

	// form state
	const [collectionId, setCollectionId] = useState<string | "">("");
	const [pieceName, setPieceName] = useState("");
	const [price, setPrice] = useState<string>("");
	const [costPrice, setCostPrice] = useState<string>("");
	const [selectedCurrency, setSelectedCurrency] = useState<{
		flag: string;
		abbreviation: string;
		name: string;
	} | null>(null);
	const [launchDate, setLaunchDate] = useState<Date | null>(null);
	const [availableNow, setAvailableNow] = useState(false);

	// Updated State for Files
	const [mainImage, setMainImage] = useState<UploadState | null>(null);
	const [galleryImages, setGalleryImages] = useState<UploadState[]>([]);
	const [sizeGuideImage, setSizeGuideImage] = useState<UploadState | null>(
		null,
	);

	// Helper to start upload immediately
	const startBackgroundUpload = async (
		file: File,
		type: "main" | "gallery" | "size-guide",
	): Promise<UploadState> => {
		const previewUrl = URL.createObjectURL(file);
		const uid = auth.currentUser?.uid || "anonymous";

		// Create store entry
		const uploadId = addUpload({
			type: "image",
			fileName: file.name,
			progress: 0,
			status: "uploading",
		});

		// Initial state
		const initialState: UploadState = {
			file,
			previewUrl,
			uploadId,
			status: "uploading",
		};

		// Start async upload
		(async () => {
			try {
				const folder = `productImages/${uid}`;
				const tags = ["product", type, uid];
				// Add product ID to tags if available? Not necessary but good practice.
				if (product?.id) tags.push(product.id);

				const url = await uploadFileDirectCloudinary(
					file,
					{
						folder,
						tags,
						resourceType: "image",
					},
					(progress) => {
						updateUpload(uploadId, { progress: Math.round(progress) });
					},
				);

				// Success
				updateUpload(uploadId, { status: "completed", progress: 100 });
				// Update local state to reflect success
				if (type === "main") {
					setMainImage((prev) =>
						prev?.uploadId === uploadId
							? { ...prev, status: "completed", uploadedUrl: url }
							: prev,
					);
				} else if (type === "gallery") {
					setGalleryImages((prev) =>
						prev.map((img) =>
							img.uploadId === uploadId
								? { ...img, status: "completed", uploadedUrl: url }
								: img,
						),
					);
				} else if (type === "size-guide") {
					setSizeGuideImage((prev) =>
						prev?.uploadId === uploadId
							? { ...prev, status: "completed", uploadedUrl: url }
							: prev,
					);
				}

				// Auto-dismiss toast
				setTimeout(() => removeUpload(uploadId), 3000);
			} catch (error: any) {
				console.error("Background upload failed:", error);
				updateUpload(uploadId, {
					status: "error",
					error: error.message || "Upload failed",
				});
				// Update local state to error
				const errMsg = error.message || "Upload failed";
				if (type === "main") {
					setMainImage((prev) =>
						prev?.uploadId === uploadId
							? { ...prev, status: "error", error: errMsg }
							: prev,
					);
				} else if (type === "gallery") {
					setGalleryImages((prev) =>
						prev.map((img) =>
							img.uploadId === uploadId
								? { ...img, status: "error", error: errMsg }
								: img,
						),
					);
				} else if (type === "size-guide") {
					setSizeGuideImage((prev) =>
						prev?.uploadId === uploadId
							? { ...prev, status: "error", error: errMsg }
							: prev,
					);
				}
			}
		})();

		return initialState;
	};

	const [description, setDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [sizes, setSizes] = useState<string[]>([]);
	const [selectedColors, setSelectedColors] = useState<
		Array<{ label: string; hex: string }>
	>([]);
	// const [copLink, setCopLink] = useState("");

	// Stock management
	const [unlimitedStock, setUnlimitedStock] = useState(true);
	const [stockQuantity, setStockQuantity] = useState("");
	const [stockMode, setStockMode] = useState<"global" | "variants">("global");
	const [variantStock, setVariantStock] = useState<Record<string, string>>({});

	// Discount
	const [hasDiscount, setHasDiscount] = useState(false);
	const [discountPercent, setDiscountPercent] = useState("");

	// Fee Settings
	const [absorbTransactionFee, setAbsorbTransactionFee] = useState(false);

	// load
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const p = await fetchProductById(id);
				if (!mounted) return;
				if (!p) {
					setErr("Product not found.");
					setLoading(false);
					return;
				}
				setProduct(p);

				const colsRaw = await getCollectionListForBrand(p.brandId);
				if (!mounted) return;
				setCollections(
					colsRaw.map((c: any) => ({
						...c,
						launchDate: asDate((c as any).launchDate),
					})),
				);

				setPieceName(p.dropName ?? "");
				setPrice(p.price != null ? String(p.price) : "");
				setCostPrice(p.costPrice != null ? String(p.costPrice) : "");
				const code = getCurrencyFromMap(p.currency) || "";
				const found = currencyList.find((c) => c.abbreviation === code) ?? null;
				setSelectedCurrency(found);

				setLaunchDate(asDate((p as any).launchDate));
				setAvailableNow(!!p.isAvailableNow);
				setCollectionId(p.dropId ?? "");

				// Initialize state for images using existing URLs
				if (p.mainVisualUrl) {
					setMainImage({
						file: null,
						previewUrl: p.mainVisualUrl,
						uploadedUrl: p.mainVisualUrl,
						status: "completed",
					});
				} else {
					setMainImage(null);
				}

				if (p.galleryImages && Array.isArray(p.galleryImages)) {
					setGalleryImages(
						p.galleryImages.map((url) => ({
							file: null,
							previewUrl: url,
							uploadedUrl: url,
							status: "completed",
						})),
					);
				} else {
					setGalleryImages([]);
				}

				if ((p as any).sizeGuideUrl) {
					setSizeGuideImage({
						file: null,
						previewUrl: (p as any).sizeGuideUrl,
						uploadedUrl: (p as any).sizeGuideUrl,
						status: "completed",
					});
				} else {
					setSizeGuideImage(null);
				}

				setDescription(p.description ?? "");
				setTags(p.styleTags ?? []);
				setSizes(p.sizeOptions ?? []);
				setSelectedColors(p.colors ?? []);
				// setCopLink(p.copLink ?? "");

				// Stock management
				const stockRem = (p as any).stockRemaining;
				const sMode = (p as any).stockMode;
				const vStock = (p as any).variantStock;

				setStockMode(sMode ?? "global");

				if (sMode === "variants") {
					// Load variant stock as strings
					const loadedStock: Record<string, string> = {};
					if (vStock) {
						Object.entries(vStock).forEach(([k, v]) => {
							loadedStock[k] = String(v);
						});
					}
					setVariantStock(loadedStock);
					// Also reset global fields just in case
					setUnlimitedStock(true);
					setStockQuantity("");
				} else {
					// Global mode
					if (stockRem === null || stockRem === undefined) {
						setUnlimitedStock(true);
						setStockQuantity("");
					} else {
						setUnlimitedStock(false);
						setStockQuantity(String(stockRem));
					}
					setVariantStock({});
				}

				// Discount
				const discount = (p as any).discountPercent;
				if (discount !== null && discount !== undefined && discount > 0) {
					setHasDiscount(true);
					setDiscountPercent(String(discount));
				} else {
					setHasDiscount(false);
					setDiscountPercent("");
				}

				// Fee Settings
				const feeSettings = (p as any).feeSettings;
				if (
					feeSettings &&
					typeof feeSettings.absorbTransactionFee === "boolean"
				) {
					setAbsorbTransactionFee(feeSettings.absorbTransactionFee);
				} else {
					setAbsorbTransactionFee(true); // Default to true
				}
			} catch (e: any) {
				setErr(e?.message ?? "Failed to load product.");
			} finally {
				setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [id]);

	// validation
	const parsedPrice = Number.isFinite(Number(price)) ? Number(price) : NaN;
	const isDisabled =
		!pieceName.trim() ||
		Number.isNaN(parsedPrice) ||
		!selectedCurrency ||
		!(availableNow ? true : !!launchDate) ||
		!mainImage;

	async function onSave() {
		if (!product) return;

		// Validation with specific messages
		const missing: string[] = [];
		if (!pieceName.trim()) missing.push("Product Name");
		if (Number.isNaN(parsedPrice)) missing.push("Price");
		if (!selectedCurrency) missing.push("Currency");
		if (!mainImage) missing.push("Main Image");
		if (!availableNow && !launchDate) missing.push("Launch Date");

		if (missing.length > 0) {
			setErr(`Please complete: ${missing.join(", ")}`);
			return;
		}

		setSaving(true);
		setErr(null);

		try {
			const auth = getAuth();
			const userId = auth.currentUser?.uid || "anonymous";

			// 1) Verify Main Image
			let mainVisualUrl = mainImage?.uploadedUrl;
			if (!mainVisualUrl) {
				if (mainImage?.status === "uploading") {
					setErr("Main image is still uploading. Please wait...");
					setSaving(false);
					return;
				}
				if (mainImage?.status === "error") {
					setErr("Main image failed to upload. Please retry.");
					setSaving(false);
					return;
				}
				setErr("Main image is required.");
				setSaving(false);
				return;
			}

			// 2) Verify Gallery
			const galleryImageUrls: string[] = [];
			const pendingGallery = galleryImages.some(
				(img) => img.status === "uploading",
			);
			if (pendingGallery) {
				setErr("Gallery images are still uploading. Please wait...");
				setSaving(false);
				return;
			}
			galleryImages.forEach((img) => {
				if (img.status === "completed" && img.uploadedUrl) {
					galleryImageUrls.push(img.uploadedUrl);
				}
			});

			// 3) Verify Size Guide
			let sizeGuideUrl: string | undefined = sizeGuideImage?.uploadedUrl;
			if (sizeGuideImage?.status === "uploading") {
				setErr("Size guide is still uploading. Please wait...");
				setSaving(false);
				return;
			}

			const launch: Date = availableNow ? new Date() : (launchDate as Date);

			const updatedData: Record<string, any> = {
				brandId: product.brandId,
				userId,
				dropId: collectionId || null,
				dropName: pieceName.trim(),
				price: parsedPrice,
				costPrice: Number.isFinite(Number(costPrice))
					? Number(costPrice)
					: null,
				currency: selectedCurrency
					? {
							abbreviation: selectedCurrency.abbreviation,
							name: selectedCurrency.name,
							flag: selectedCurrency.flag,
						}
					: null,
				launchDate: launch,
				isAvailableNow: availableNow,
				isActive: true,
				stockRemaining: unlimitedStock
					? null
					: Number.isFinite(Number(stockQuantity))
						? Number(stockQuantity)
						: null,
				stockMode,
				variantStock:
					stockMode === "variants"
						? Object.entries(variantStock).reduce(
								(acc, [key, val]) => {
									const num = Number(val);
									if (val && Number.isFinite(num)) acc[key] = num;
									return acc;
								},
								{} as Record<string, number>,
							)
						: null,
				mainVisualUrl,
				galleryImages: galleryImageUrls.length ? galleryImageUrls : null,
				sizeGuideUrl: sizeGuideUrl || null,
				description: description.trim() ? description.trim() : null,
				styleTags: tags.length ? tags : null,
				sizeOptions: sizes.length ? sizes : null,
				colors: selectedColors.length ? selectedColors : null,
				copLink: null, // Set to null for store orders
				discountPercent:
					hasDiscount && Number.isFinite(Number(discountPercent))
						? Number(discountPercent)
						: null,
				feeSettings: {
					absorbTransactionFee: absorbTransactionFee,
				},
			};

			Object.keys(updatedData).forEach((k) => {
				if (updatedData[k] === undefined) delete updatedData[k];
			});

			await updateDropProduct(product.id, updatedData);
			router.back();
		} catch (e: any) {
			setErr(e?.message ?? "Failed to save changes.");
		} finally {
			setSaving(false);
		}
	}

	async function onDelete() {
		if (!product) return;
		if (!confirm("Delete this product? This cannot be undone.")) return;
		setDeleting(true);
		setErr(null);
		try {
			await deleteDropProduct(product.id, product.brandId);
			router.push("/brand-space");
		} catch (e: any) {
			setErr(e?.message ?? "Failed to delete.");
		} finally {
			setDeleting(false);
		}
	}

	const Divider = () => <div className="my-7 border-t border-stroke/40" />;

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!product) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<div className="text-center">
					<p className="text-text-muted mb-4">{err ?? "Product not found"}</p>
					<Button text="Back" onClick={() => router.back()} />
				</div>
			</div>
		);
	}

	return (
		<div className="pb-24">
			<div className="px-4 sm:px-6 pt-6">
				<h1 className="font-heading font-semibold text-2xl">Edit Product</h1>
				<p className="text-text-muted mt-1">Update your product details below.</p>
			</div>

			<div className="px-4 sm:px-6 mt-6 space-y-4">
				{/* 1. Identity */}
				<Group>
					<Label text="Product Name" required />
					<Input
						value={pieceName}
						onChange={setPieceName}
						placeholder="Camo Hoodie"
					/>
					<div className="mt-4">
						<Label text="Part of a collection? (Optional)" />
						<Select
							value={collectionId}
							onChange={(v) => {
								setCollectionId(v);
								const match = collections.find((c) => c.id === v);
								if (match?.launchDate) setLaunchDate(match.launchDate);
							}}
							placeholder={
								collections.length ? "Tap to select" : "No collections found"
							}
							options={[
								{ label: "— None —", value: "" },
								...collections.map((c) => ({ label: c.name, value: c.id })),
							]}
						/>
						<Hint text="Use this to connect your product to one of your collections." />
					</div>
				</Group>

				{/* 2. Pricing */}
				<Group>
					<div className="grid grid-cols-3 gap-3">
						<div className="col-span-1">
							<Label text="Currency" required />
							<CurrencyDropdown
								value={selectedCurrency}
								onChange={setSelectedCurrency}
							/>
						</div>
						<div className="col-span-2">
							<Label text="Set Price" required />
							<Input
								type="number"
								value={price}
								onChange={setPrice}
								placeholder="Enter amount"
							/>
							{price && !Number.isNaN(parsedPrice) && (
								<div className="text-text-muted text-sm mt-1">
									{selectedCurrency?.abbreviation
										? `${selectedCurrency.abbreviation} `
										: ""}
									{formatWithCommasDouble(parsedPrice)}
								</div>
							)}
						</div>
					</div>

					{/* Cost Price (Internal) */}
					<div className="mt-4 pt-4 border-t border-stroke/40">
						<Label text="Cost Price (Internal)" />
						<Input
							type="number"
							value={costPrice}
							onChange={setCostPrice}
							placeholder="Enter amount"
						/>
						{costPrice &&
							!Number.isNaN(
								Number.isFinite(Number(costPrice)) ? Number(costPrice) : NaN,
							) && (
								<div className="text-text-muted text-sm mt-1">
									{selectedCurrency?.abbreviation
										? `${selectedCurrency.abbreviation} `
										: ""}
									{formatWithCommasDouble(
										Number.isFinite(Number(costPrice))
											? Number(costPrice)
											: NaN,
									)}
								</div>
							)}
						<Hint text="Used for internal profit calculation. Not visible to customers." />
					</div>

					<div className="mt-4">
						<div className="rounded-xl bg-surface-neutral/50 p-4 border border-stroke/50">
							<div className="flex gap-3">
								<div className="flex-shrink-0 mt-0.5">
									<div className="w-1 h-full min-h-[24px] rounded-full bg-cta/40" />
								</div>
								<div className="text-sm">
									<p className="font-medium text-text mb-1">
										Labeld Marketplace Fee
									</p>
									<p className="text-text-muted">
										A 5% transaction fee is applied to sales on the global
										marketplace, paid by the customer. This does not apply to
										your custom storefront.
									</p>
								</div>
							</div>
						</div>
					</div>
				</Group>

				{/* 3. Sizes & Stock */}
				<Group>
					{/* Sizes First */}
					<div>
						<Label text="Size Options" />
						<TagsInput
							value={sizes}
							onChange={setSizes}
							placeholder="e.g. S, M, L, XL..."
						/>
					</div>

					<Divider />

					{/* Colors */}
					<div>
						<Label text="Color Options" />
						<ColorPicker colors={selectedColors} onChange={setSelectedColors} />
						<Hint text="Add color variants if applicable (e.g. Midnight Blue, #191970)" />
					</div>

					<Divider />

					{/* Stock Second */}
					<div>
						<Label text="Stock Management" />
						<div className="space-y-4">
							{/* 1. Overall Mode Toggle (Unified vs. Variant) */}
							<div className="flex bg-surface-neutral p-1 rounded-lg w-fit">
								<button
									type="button"
									onClick={() => setStockMode("global")}
									className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all ${
										stockMode === "global"
											? "bg-text shadow text-bg"
											: "text-text-muted hover:text-text"
									}`}
								>
									Unified Stock
								</button>
								<button
									type="button"
									onClick={() => setStockMode("variants")}
									className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all ${
										stockMode === "variants"
											? "bg-text shadow text-bg"
											: "text-text-muted hover:text-text"
									}`}
								>
									Stock by Variant
								</button>
							</div>

							<Hint
								text={
									stockMode === "global"
										? "Manage a single stock count for all variations of this product."
										: "Set specific stock counts for each size and color combination."
								}
							/>

							{/* 2. Global Mode Logic */}
							{stockMode === "global" && (
								<div className="space-y-3 pt-2">
									<Toggle
										checked={unlimitedStock}
										onChange={(v) => {
											setUnlimitedStock(v);
											if (v) setStockQuantity("");
										}}
										label="Unlimited Stock"
									/>
									{unlimitedStock && (
										<Hint text="Best for made-to-order or ongoing pieces" />
									)}
									{!unlimitedStock && (
										<div className="mt-2 space-y-4">
											<Toggle
												checked={
													stockQuantity !== "" && Number(stockQuantity) === 0
												}
												onChange={(v) => {
													if (v) setStockQuantity("0");
													else setStockQuantity("");
												}}
												label="Mark as Sold Out"
											/>
											{stockQuantity !== "" && Number(stockQuantity) === 0 ? (
												<Hint text="Product checks out as sold out. Customers cannot purchase it." />
											) : (
												<div>
													<Label text="Stock Quantity" required />
													<Input
														type="number"
														value={stockQuantity}
														onChange={setStockQuantity}
														placeholder="Enter available quantity"
													/>
													<Hint text="Set how many units are available for purchase" />
												</div>
											)}
										</div>
									)}
								</div>
							)}

							{/* 3. Variant Mode Logic */}
							{stockMode === "variants" && (
								<div className="pt-2">
									{!sizes.length && !selectedColors.length ? (
										<div className="p-4 bg-surface-neutral/50 rounded-xl text-center text-sm text-text-muted">
											Add size or color options above to configure variant
											stock.
										</div>
									) : (
										<div className="border border-stroke rounded-xl overflow-hidden">
											<div className="bg-surface-neutral/30 px-4 py-3 border-b border-stroke text-xs font-semibold uppercase text-text-muted tracking-wider">
												Product Variants
											</div>
											<div className="divide-y divide-stroke/50 max-h-[400px] overflow-y-auto">
												{(() => {
													// Generate combinations
													const sizeOpts = sizes.length ? sizes : [""];
													const colorOpts = selectedColors.length
														? selectedColors
														: [{ label: "", hex: "" }];

													const variants: {
														key: string;
														name: string;
														colorHex?: string;
													}[] = [];

													sizeOpts.forEach((s) => {
														colorOpts.forEach((c) => {
															// Key format: size-colorLabel
															const key = `${s}-${c.label}`;

															// Display Name
															let name = "";
															if (s && c.label) name = `${s} / ${c.label}`;
															else if (s) name = s;
															else if (c.label) name = c.label;
															else name = "General";

															variants.push({
																key,
																name,
																colorHex: c.hex,
															});
														});
													});

													return variants.map((v) => {
														const qty = variantStock[v.key] ?? "";
														const isSoldOut = qty !== "" && Number(qty) === 0;

														return (
															<div
																key={v.key}
																className="flex items-center justify-between p-4 bg-surface hover:bg-surface-neutral/20 transition-colors"
															>
																<div className="flex items-center gap-3">
																	{v.colorHex && (
																		<div
																			className="w-4 h-4 rounded-full border border-stroke/20 shadow-sm"
																			style={{ backgroundColor: v.colorHex }}
																		/>
																	)}
																	<span className="font-medium text-text text-sm">
																		{v.name}
																	</span>
																</div>
																<div className="flex items-center gap-2">
																	{isSoldOut ? (
																		<span className="text-xs font-medium text-alert bg-alert/10 px-2 py-1 rounded">
																			Sold Out
																		</span>
																	) : (
																		<span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded">
																			In Stock
																		</span>
																	)}
																	<input
																		type="number"
																		placeholder="0"
																		className="w-20 text-sm px-3 py-1.5 rounded-lg border border-stroke bg-bg outline-none focus:border-accent text-right"
																		value={qty}
																		onChange={(e) =>
																			setVariantStock((prev) => ({
																				...prev,
																				[v.key]: e.target.value,
																			}))
																		}
																	/>
																</div>
															</div>
														);
													});
												})()}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</Group>

				{/* 4. Drop Timing */}
				<Group>
					<Label text="Drop Timing" required />
					<DateTimePicker value={launchDate} onChange={setLaunchDate} />
					{!!collectionId &&
						collections.find(
							(c) =>
								c.id === collectionId &&
								c.launchDate &&
								launchDate &&
								+c.launchDate! === +launchDate!,
						) && <Hint text="Product matches drop collection launch date." />}
					<div className="mt-4">
						<Toggle
							checked={availableNow}
							onChange={(v) => {
								setAvailableNow(v);
								if (v) setLaunchDate(new Date());
							}}
							label="Make this product live immediately"
						/>
					</div>
				</Group>

				{/* 5. Visuals */}
				<Group>
					<Label text="Main Product Visual" required />
					<SingleImagePicker
						file={mainImage?.file ?? null}
						previewUrl={mainImage?.previewUrl}
						isUploading={mainImage?.status === "uploading"}
						isError={mainImage?.status === "error"}
						onPick={async (f) => {
							if (f) {
								setMainImage(await startBackgroundUpload(f, "main"));
							} else {
								// If clearing, we might want to revert to nothing
								setMainImage(null);
							}
						}}
					/>
					<Hint text="This is the first image people see" />

					<div className="mt-6">
						<Label text="Gallery Shots" />
						<MultiImagePicker
							images={galleryImages}
							onAddFiles={async (addedFiles) => {
								const newStates = await Promise.all(
									addedFiles.map((f) => startBackgroundUpload(f, "gallery")),
								);
								setGalleryImages((prev) => [...prev, ...newStates]);
							}}
							onRemove={(index) => {
								setGalleryImages((prev) => prev.filter((_, i) => i !== index));
							}}
						/>
						<Hint text="Extra angles or details (up to 4)" />
					</div>

					<div className="mt-6">
						<Label text="Size Guide" />
						<SingleImagePicker
							file={sizeGuideImage?.file ?? null}
							previewUrl={sizeGuideImage?.previewUrl}
							isUploading={sizeGuideImage?.status === "uploading"}
							isError={sizeGuideImage?.status === "error"}
							onPick={async (f) => {
								if (f) {
									setSizeGuideImage(
										await startBackgroundUpload(f, "size-guide"),
									);
								} else {
									setSizeGuideImage(null);
								}
							}}
						/>
						<Hint text="Upload a size guide image to help customers choose the right size" />
					</div>
				</Group>

				{/* 6. Story */}
				<Group>
					<Label text="Description" />
					<Textarea
						value={description}
						onChange={setDescription}
						placeholder="Tell the story behind this product. Inspiration, process, or meaning — anything you want people to feel."
					/>
				</Group>

				{/* 7. Discovery */}
				<Group>
					<Label text="Product Tags" />
					<TagsInput
						value={tags}
						onChange={setTags}
						placeholder="Add your tags"
					/>
					<Hint text="Helps people discover your product" />
				</Group>

				{/* 8. Advanced Settings (Discount) */}
				<div className="pt-4">
					<p className="px-2 text-sm font-medium text-text-muted mb-2">
						Advanced Settings
					</p>
					<Group>
						<Label text="Discount" />
						<div className="space-y-3">
							<Toggle
								checked={hasDiscount}
								onChange={(v) => {
									setHasDiscount(v);
									if (!v) setDiscountPercent("");
								}}
								label="Apply Discount"
							/>
							{hasDiscount && (
								<div>
									<Label text="Discount Percentage" required />
									<Input
										type="number"
										value={discountPercent}
										onChange={setDiscountPercent}
										placeholder="e.g. 10, 20, 50"
									/>
									<Hint text="Enter discount percentage (0-100)" />
									{discountPercent &&
										Number.isFinite(Number(discountPercent)) && (
											<div className="text-text-muted text-sm mt-1">
												Discounted price: {selectedCurrency?.abbreviation || ""}{" "}
												{formatWithCommasDouble(
													parsedPrice * (1 - Number(discountPercent) / 100),
												)}{" "}
												<span className="text-green-600">
													({discountPercent}% off)
												</span>
											</div>
										)}
								</div>
							)}
						</div>
					</Group>
				</div>

				<div className="h-16" />
			</div>

			{/* Sticky footer with Save + Delete */}
			<div className="fixed inset-x-0 bottom-0 bg-bg/80 backdrop-blur border-t border-stroke px-4 sm:px-6 py-3">
				<div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
					<Button
						text={deleting ? "Deleting…" : "Delete Product"}
						variant="outline"
						outlineColor="alert"
						onClick={onDelete}
						disabled={deleting}
					/>
					<Button
						text={saving ? "Saving…" : "Save Changes"}
						onClick={onSave}
						disabled={saving}
						variant="primary"
					/>
				</div>
			</div>

			{err && (
				<div className="fixed left-1/2 -translate-x-1/2 bottom-20 bg-alert/10 text-alert px-4 py-2 rounded-xl border border-alert/20">
					{err}
				</div>
			)}
		</div>
	);
}

/* ------------------------------ UI helpers ------------------------------- */

function Group({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-2xl border border-stroke bg-surface p-6">
			{children}
		</div>
	);
}

function Label({ text, required }: { text: string; required?: boolean }) {
	return (
		<div className="text-sm font-medium mb-2">
			{text} {required ? <span className="text-red-500">*</span> : null}
		</div>
	);
}

function Hint({ text }: { text: string }) {
	return <div className="text-text-muted text-sm mt-1">{text}</div>;
}

function baseFieldClasses() {
	return "w-full rounded-xl border border-stroke bg-surface px-3 py-2 outline-none focus:border-accent";
}

function Input({
	value,
	onChange,
	placeholder,
	type = "text",
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	type?: string;
}) {
	return (
		<input
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			type={type}
			className={baseFieldClasses()}
		/>
	);
}

function Textarea({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
}) {
	return (
		<textarea
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			rows={4}
			className={baseFieldClasses()}
		/>
	);
}

function ColorPicker({
	colors,
	onChange,
}: {
	colors: { label: string; hex: string }[];
	onChange: (v: { label: string; hex: string }[]) => void;
}) {
	const [label, setLabel] = useState("");
	const [hex, setHex] = useState("#000000");

	function addColor() {
		if (!label.trim()) return;
		// Ensure hex is full 6 chars if user typed it manually, or trust the picker
		// Simple validation:
		const cleanHex = hex.startsWith("#") ? hex : `#${hex}`;
		onChange([...colors, { label: label.trim(), hex: cleanHex }]);
		setLabel("");
		setHex("#000000");
	}

	function removeColor(index: number) {
		onChange(colors.filter((_, i) => i !== index));
	}

	return (
		<div className="space-y-3">
			{/* List of added colors */}
			{colors.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{colors.map((c, i) => (
						<div
							key={i}
							className="flex items-center gap-2 rounded-full border border-stroke pl-1 pr-3 py-1 bg-surface"
						>
							<div
								className="w-4 h-4 rounded-full border border-stroke/20"
								style={{ backgroundColor: c.hex }}
							/>
							<span className="text-sm font-medium">{c.label}</span>
							<button
								type="button"
								onClick={() => removeColor(i)}
								className="text-text-muted hover:text-alert ml-1"
							>
								×
							</button>
						</div>
					))}
				</div>
			)}

			{/* Input row */}
			<div className="flex gap-2 items-end">
				<div className="flex-1">
					<div className="text-xs text-text-muted mb-1 ml-1">Label</div>
					<input
						className={baseFieldClasses()}
						placeholder="e.g. Navy Blue"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addColor();
							}
						}}
					/>
				</div>
				<div>
					<div className="text-xs text-text-muted mb-1 ml-1">Color</div>
					<div className="h-[42px] w-[50px] relative rounded-xl border border-stroke overflow-hidden cursor-pointer">
						<input
							type="color"
							value={hex}
							onChange={(e) => setHex(e.target.value)}
							className="absolute -top-2 -left-2 w-[200%] h-[200%] cursor-pointer p-0 m-0 opacity-0"
						/>
						<div className="w-full h-full" style={{ backgroundColor: hex }} />
					</div>
				</div>
				<button
					type="button"
					onClick={addColor}
					disabled={!label.trim()}
					className="h-[42px] px-4 rounded-xl border border-stroke bg-surface hover:bg-surface-neutral disabled:opacity-50 transition-colors font-medium text-sm"
				>
					Add
				</button>
			</div>
		</div>
	);
}

function Select({
	value,
	onChange,
	options,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	options: Array<{ label: string; value: string }>;
}) {
	return (
		<select
			className={baseFieldClasses()}
			value={value}
			onChange={(e) => onChange(e.target.value)}
		>
			{placeholder ? <option value="">{placeholder}</option> : null}
			{options.map((o) => (
				<option key={o.value} value={o.value}>
					{o.label}
				</option>
			))}
		</select>
	);
}

function Toggle({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
	label: string;
}) {
	return (
		<label className="inline-flex items-center gap-3 cursor-pointer">
			<input
				type="checkbox"
				className="size-4 accent-current"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<span>{label}</span>
		</label>
	);
}

function CurrencyDropdown({
	value,
	onChange,
}: {
	value: { flag: string; abbreviation: string; name: string } | null;
	onChange: (
		v: { flag: string; abbreviation: string; name: string } | null,
	) => void;
}) {
	const val = value?.abbreviation ?? "";
	return (
		<select
			className={baseFieldClasses()}
			value={val}
			onChange={(e) => {
				const abbr = e.target.value;
				const found = currencyList.find((c) => c.abbreviation === abbr) || null;
				onChange(found);
			}}
		>
			<option value="">Select currency</option>
			{currencyList.map((c) => (
				<option key={c.abbreviation} value={c.abbreviation}>
					{c.flag} {c.name}
				</option>
			))}
		</select>
	);
}

function DateTimePicker({
	value,
	onChange,
}: {
	value: Date | null;
	onChange: (d: Date | null) => void;
}) {
	const local = value
		? new Date(value.getTime() - value.getTimezoneOffset() * 60000)
				.toISOString()
				.slice(0, 16)
		: "";
	return (
		<input
			type="datetime-local"
			className={baseFieldClasses()}
			value={local}
			onChange={(e) =>
				onChange(e.target.value ? new Date(e.target.value) : null)
			}
		/>
	);
}

function SingleImagePicker({
	file,
	previewUrl,
	isUploading,
	isError,
	onPick,
}: {
	file: File | null;
	previewUrl?: string;
	isUploading?: boolean;
	isError?: boolean;
	onPick: (f: File | null) => void;
}) {
	return (
		<div className="w-full max-w-xs">
			<label
				className={`block w-full relative cursor-pointer rounded-xl border-2 border-dashed transition-colors overflow-hidden group bg-surface hover:bg-surface/80 ${
					isError
						? "border-alert"
						: isUploading
							? "border-accent"
							: "border-stroke hover:border-text"
				}`}
				style={{ aspectRatio: "1/1" }}
			>
				{previewUrl ? (
					<>
						<OptimizedImage
							src={previewUrl}
							alt="Preview"
							fill
							sizeContext="card"
							objectFit="cover"
							className={`w-full h-full object-cover ${
								isUploading ? "opacity-50" : ""
							}`}
						/>
						{isUploading && (
							<div className="absolute inset-0 flex items-center justify-center">
								<Spinner size="md" />
							</div>
						)}
						{!isUploading && (
							<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
								<span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
									Change Image
								</span>
							</div>
						)}
					</>
				) : (
					<div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
						<div className="w-10 h-10 mb-3 text-text-muted">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
								<polyline points="17 8 12 3 7 8" />
								<line x1="12" x2="12" y1="3" y2="15" />
							</svg>
						</div>
						<p className="text-text font-medium">Upload Image</p>
					</div>
				)}
				<input
					type="file"
					accept="image/*"
					className="sr-only"
					onChange={(e) => onPick(e.target.files?.[0] ?? null)}
					disabled={isUploading}
				/>
			</label>
		</div>
	);
}

/* -------- Flutter-parity gallery picker: grid layout, cap 4, clear/remove ------ */

function MultiImagePicker({
	images,
	onAddFiles,
	onRemove,
}: {
	images: UploadState[];
	onAddFiles: (files: File[]) => void;
	onRemove: (index: number) => void;
}) {
	const MAX = 4;
	const [msg, setMsg] = useState<string | null>(null);

	const total = images.length;
	const slotsLeft = Math.max(0, MAX - total);

	function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
		const picked = Array.from(e.target.files ?? []);
		if (!picked.length) return;

		if (slotsLeft <= 0) {
			setMsg(`You can only upload up to ${MAX} images.`);
			e.currentTarget.value = "";
			return;
		}

		const take = picked.slice(0, slotsLeft);
		onAddFiles(take);

		if (picked.length > take.length) {
			setMsg(
				`Only ${slotsLeft} more image${
					slotsLeft === 1 ? "" : "s"
				} allowed (max ${MAX}).`,
			);
		} else {
			setMsg(null);
		}
		e.currentTarget.value = "";
	}

	return (
		<div>
			<div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
				{/* Images */}
				{images.map((img, i) => {
					const isUploading = img.status === "uploading";
					const isError = img.status === "error";

					return (
						<div
							key={`${img.file?.name ?? img.uploadedUrl}-${i}`}
							className={`relative rounded-xl border overflow-hidden group ${
								isError
									? "border-alert"
									: isUploading
										? "border-accent"
										: "border-stroke"
							}`}
							style={{ aspectRatio: "1/1" }}
						>
							<OptimizedImage
								src={img.previewUrl}
								alt="Gallery image"
								fill
								sizeContext="thumbnail"
								objectFit="cover"
								className={isUploading ? "opacity-50" : ""}
							/>
							{isUploading && (
								<div className="absolute inset-0 flex items-center justify-center">
									<Spinner size="sm" />
								</div>
							)}
							<button
								type="button"
								className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
								title="Remove"
								onClick={() => onRemove(i)}
							>
								<svg
									className="w-4 h-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						</div>
					);
				})}

				{/* Upload Button */}
				{slotsLeft > 0 && (
					<label
						className="block cursor-pointer rounded-xl border-2 border-dashed border-stroke hover:border-text transition-colors bg-surface hover:bg-surface/80 relative group"
						style={{ aspectRatio: "1/1" }}
					>
						<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
							<div className="w-8 h-8 mb-1 text-text-muted group-hover:text-text transition-colors">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M5 12h14" />
									<path d="M12 5v14" />
								</svg>
							</div>
							<div className="text-xs font-medium text-text-muted group-hover:text-text">
								Add
							</div>
							<div className="text-[10px] text-text-muted/70">
								{total}/{MAX}
							</div>
						</div>
						<input
							type="file"
							accept="image/*"
							multiple
							className="sr-only"
							onChange={handleAdd}
						/>
					</label>
				)}
			</div>

			{msg && <div className="text-xs text-alert mt-2">{msg}</div>}
		</div>
	);
}

function TagsInput({
	value,
	onChange,
	placeholder,
}: {
	value: string[];
	onChange: (v: string[]) => void;
	placeholder?: string;
}) {
	const [draft, setDraft] = useState("");
	function addTag() {
		const t = draft.trim();
		if (!t) return;
		if (!value.includes(t)) onChange([...value, t]);
		setDraft("");
	}
	function removeTag(t: string) {
		onChange(value.filter((x) => x !== t));
	}
	return (
		<div>
			<div className="flex flex-wrap gap-2 mb-2">
				{value.map((t) => (
					<span
						key={t}
						className="inline-flex items-center gap-2 rounded-full border border-stroke px-3 py-1"
					>
						{t}
						<button
							className="text-text-muted"
							onClick={() => removeTag(t)}
							title="Remove"
						>
							×
						</button>
					</span>
				))}
			</div>
			<div className="flex gap-2">
				<input
					className={baseFieldClasses()}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					placeholder={placeholder}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							addTag();
						}
					}}
				/>
				<button
					className="rounded-xl border border-stroke px-3 py-2"
					onClick={addTag}
					type="button"
				>
					Add
				</button>
			</div>
		</div>
	);
}
