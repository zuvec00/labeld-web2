/* /app/brand/piece/new/page.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatWithCommasDouble } from "@/lib/format";

import { getCollectionListForBrand } from "@/lib/firebase/queries/collection";
import { uploadFileGetURL } from "@/lib/storage/upload";
import { uploadImageCloudinary } from "@/lib/storage/cloudinary";
import { fetchBrandById } from "@/lib/firebase/queries/brandspace";
import { sendNotificationCF } from "@/lib/firebase/callables/users";
import { addDropProductCF } from "@/lib/firebase/queries/product";
import RadarPromotionPopup from "@/components/radar/RadarPromotionPopup";

/* ----------------------------- Currency list ---------------------------- */
const currencyList: Array<{
	flag: string;
	abbreviation: string;
	name: string;
}> = [
	{ flag: "🇳🇬", abbreviation: "NGN", name: "Naira (NGN)" },
	// { flag: "🇺🇸", abbreviation: "USD", name: "US Dollar (USD)" },
	// { flag: "🇬🇧", abbreviation: "GBP", name: "Pound Sterling (GBP)" },
	// { flag: "🇪🇺", abbreviation: "EUR", name: "Euro (EUR)" },
];

/* --------------------------------- utils -------------------------------- */
function asDate(v: any): Date | null {
	if (!v) return null;
	if (v instanceof Date) return v;
	if (typeof v?.toDate === "function") return v.toDate();
	if (typeof v === "string") {
		const d = new Date(v);
		return isNaN(+d) ? null : d;
	}
	return null;
}

function serializeBrandSnapshot(b: any) {
	if (!b) return null;
	const toISO = (x: any) =>
		x instanceof Date
			? x.toISOString()
			: typeof x?.toDate === "function"
				? x.toDate().toISOString()
				: typeof x === "string"
					? x
					: undefined;

	const out: Record<string, any> = {
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
		createdAt: toISO(b.createdAt),
		updatedAt: toISO(b.updatedAt),
	};
	Object.keys(out).forEach((k) => out[k] == null && delete out[k]);
	return out;
}

/* ---------------------------------- Page --------------------------------- */
export default function NewPiecePage() {
	const router = useRouter();
	const auth = getAuth();

	const [bootLoading, setBootLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	// const [brandIG, setBrandIG] = useState<string | null>(null);
	const [brandSnap, setBrandSnap] = useState<any>(null);

	const [collections, setCollections] = useState<
		Array<{ id: string; name: string; launchDate?: Date | null }>
	>([]);

	// form
	const [collectionId, setCollectionId] = useState<string>("");
	const [pieceName, setPieceName] = useState("");
	const [price, setPrice] = useState("");
	const [selectedCurrency, setSelectedCurrency] = useState<{
		flag: string;
		abbreviation: string;
		name: string;
	} | null>(null);
	const [launchDate, setLaunchDate] = useState<Date | null>(null);
	const [availableNow, setAvailableNow] = useState(false);

	const [mainFile, setMainFile] = useState<File | null>(null);
	const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
	const [sizeGuideFile, setSizeGuideFile] = useState<File | null>(null);

	const [description, setDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [sizes, setSizes] = useState<string[]>([]);
	const [selectedColors, setSelectedColors] = useState<
		Array<{ label: string; hex: string }>
	>([]);
	// const [copLink, setCopLink] = useState("");
	// const [useInstagramLink, setUseInstagramLink] = useState(false);

	// Stock management
	const [unlimitedStock, setUnlimitedStock] = useState(true);
	const [stockQuantity, setStockQuantity] = useState("");
	const [stockMode, setStockMode] = useState<"global" | "variants">("global");
	const [variantStock, setVariantStock] = useState<Record<string, string>>({});

	// Discount
	const [hasDiscount, setHasDiscount] = useState(false);
	const [discountPercent, setDiscountPercent] = useState("");

	// Fee Settings -- Enforce Customer Pays (i.e. Seller Absorb = false)
	const [absorbTransactionFee] = useState(false);

	// Radar promotion popup
	const [showRadarPopup, setShowRadarPopup] = useState(false);
	const [createdPieceData, setCreatedPieceData] = useState<any>(null);

	// size chips
	const predefinedSizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

	/* ---------------------------- bootstrap data --------------------------- */
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const uid = auth.currentUser?.uid;
				if (!uid) {
					router.push("/");
					return;
				}
				const [cols, brand] = await Promise.all([
					getCollectionListForBrand(uid),
					fetchBrandById(uid),
				]);

				if (!mounted) return;

				setCollections(
					(cols as any[]).map((c) => ({
						...c,
						launchDate: asDate(c.launchDate),
					})),
				);
				// setBrandIG(brand?.instagram ?? null);
				setBrandSnap(serializeBrandSnapshot(brand));
			} catch (e: any) {
				if (!mounted) return;
				setErr(e?.message ?? "Failed to load form.");
			} finally {
				if (mounted) setBootLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [auth.currentUser, router]);

	/* ------------------------------- derived ------------------------------- */
	const parsedPrice = Number.isFinite(Number(price)) ? Number(price) : NaN;

	const isDisabled =
		!pieceName.trim() ||
		!mainFile ||
		Number.isNaN(parsedPrice) ||
		!selectedCurrency ||
		!(availableNow ? true : !!launchDate);

	// auto-fill IG link toggle
	// useEffect(() => {
	// 	if (!brandIG) return;
	// 	if (useInstagramLink) {
	// 		const igUrl = brandIG.startsWith("http")
	// 			? brandIG
	// 			: `https://instagram.com/${brandIG}`;
	// 		setCopLink(igUrl);
	// 	}
	// }, [useInstagramLink, brandIG]);

	/* -------------------------------- actions ------------------------------- */
	async function onCreate() {
		if (isDisabled) return;
		setSaving(true);
		setErr(null);
		try {
			const uid = auth.currentUser?.uid;
			if (!uid) {
				router.push("/");
				return;
			}
			// 1) upload main
			let mainVisualUrl: string;
			try {
				// Primary: Upload to Cloudinary
				mainVisualUrl = await uploadImageCloudinary(mainFile!, {
					folder: `productImages/${uid}`,
					tags: ["product", "main", uid],
				});
				console.log(
					"✅ Main product image uploaded to Cloudinary:",
					mainVisualUrl,
				);
			} catch (cloudinaryError) {
				// Fallback: Upload to Firebase Storage
				console.warn(
					"⚠️ Cloudinary upload failed, falling back to Firebase Storage:",
					cloudinaryError,
				);
				mainVisualUrl = await uploadFileGetURL(
					mainFile!,
					`productImages/${uid}/${Date.now()}-${mainFile!.name}`,
				);
				console.log(
					"✅ Main product image uploaded to Firebase Storage:",
					mainVisualUrl,
				);
			}

			// 2) upload gallery (optional, cap 4)
			let galleryImageUrls: string[] | undefined;
			if (galleryFiles.length) {
				const take = galleryFiles.slice(0, 4);
				galleryImageUrls = [];

				for (const f of take) {
					try {
						// Primary: Upload to Cloudinary
						const url = await uploadImageCloudinary(f, {
							folder: `productImages/${uid}`,
							tags: ["product", "gallery", uid],
						});
						galleryImageUrls.push(url);
						console.log(
							"✅ Gallery product image uploaded to Cloudinary:",
							url,
						);
					} catch (cloudinaryError) {
						// Fallback: Upload to Firebase Storage
						console.warn(
							"⚠️ Cloudinary upload failed for gallery image, falling back to Firebase Storage:",
							cloudinaryError,
						);
						const url = await uploadFileGetURL(
							f,
							`productImages/${uid}/${Date.now()}-${f.name}`,
						);
						galleryImageUrls.push(url);
						console.log(
							"✅ Gallery product image uploaded to Firebase Storage:",
							url,
						);
					}
				}
			}

			// 3) upload size guide (optional)
			let sizeGuideUrl: string | undefined;
			if (sizeGuideFile) {
				try {
					// Primary: Upload to Cloudinary
					sizeGuideUrl = await uploadImageCloudinary(sizeGuideFile, {
						folder: `productImages/${uid}`,
						tags: ["product", "size-guide", uid],
					});
					console.log(
						"✅ Size guide image uploaded to Cloudinary:",
						sizeGuideUrl,
					);
				} catch (cloudinaryError) {
					// Fallback: Upload to Firebase Storage
					console.warn(
						"⚠️ Cloudinary upload failed for size guide, falling back to Firebase Storage:",
						cloudinaryError,
					);
					sizeGuideUrl = await uploadFileGetURL(
						sizeGuideFile,
						`productImages/${uid}/${Date.now()}-${sizeGuideFile.name}`,
					);
					console.log(
						"✅ Size guide image uploaded to Firebase Storage:",
						sizeGuideUrl,
					);
				}
			}

			// 4) launch date
			const launch: Date = availableNow ? new Date() : (launchDate as Date);

			// 5) build payload (Flutter parity + denormalized brand)
			const productData: Record<string, any> = {
				brandId: uid,
				userId: uid,
				dropId: collectionId || null,
				dropName: pieceName.trim(),
				price: parsedPrice,
				currency: selectedCurrency
					? {
							flag: selectedCurrency.flag,
							abbreviation: selectedCurrency.abbreviation,
							name: selectedCurrency.name,
						}
					: null,
				launchDate: launch.toISOString(),
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
				galleryImages: galleryImageUrls,
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
				// ⭐ denormalized brand snapshot
				brand: brandSnap ?? undefined,
			};
			Object.keys(productData).forEach(
				(k) => productData[k] == null && delete productData[k],
			);

			// 6) write via CF
			const result = await addDropProductCF(productData);
			console.log("addDropProductCF result:", result);

			const { id } = result;

			// 7) optional notif (parity with Flutter)
			try {
				// await sendNotificationCF({
				// 	title: "New drop 👀",
				// 	content: "Be the first to check it out",
				// 	externalUserIds: [uid], // or your follower targeting on the backend
				// });
			} catch {
				/* non-fatal */
			}

			// 8) Show radar promotion popup with piece data
			if (!id) {
				console.error(
					"No product ID returned from addDropProductCF. Result:",
					result,
				);
				setErr("Failed to get product ID. Please try again.");
				return;
			}

			// Now we have the real product ID from the backend!
			setCreatedPieceData({
				id,
				dropName: pieceName.trim(),
				mainVisualUrl,
				styleTags: tags.length ? tags : null,
				dropId: collectionId || null,
				launchDate: launch.toISOString(),
			});
			setShowRadarPopup(true);
		} catch (e: any) {
			setErr(e?.message ?? "Failed to create piece.");
		} finally {
			setSaving(false);
		}
	}

	/* -------------------------------- render -------------------------------- */
	if (bootLoading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	// Divider component for enhanced visibility between settings
	function FieldDivider() {
		return <hr className="my-6 border-t border-edit/20" />;
	}

	return (
		<div className="pb-24">
			<div className="px-4 sm:px-6 pt-6">
				<h1 className="font-heading font-semibold text-2xl">Drop a Product</h1>
				<p className="text-text-muted mt-1">
					Ready to show off your next masterpiece? Drop a piece and let your
					fans fall in love.
				</p>
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
						<Hint text="Use this to connect your piece to one of your collections." />
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
						<div className="flex flex-wrap gap-2 mb-2">
							{predefinedSizes.map((s) => {
								const isSelected = sizes.includes(s);
								const oneSizeSelected = sizes.includes("One Size");
								const isDisabled =
									(s !== "One Size" && oneSizeSelected) ||
									(s === "One Size" && sizes.length > 0 && !isSelected);
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
													isSelected
														? prev.filter((x) => x !== s)
														: [...prev, s],
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
							{sizes.length > 1 && (
								<button
									type="button"
									className="text-alert text-sm border border-alert/30 rounded-lg px-2.5"
									onClick={() => setSizes([])}
								>
									Clear All
								</button>
							)}
						</div>
						{sizes.includes("One Size") && (
							<Hint text={`Only "One Size" can be selected at a time.`} />
						)}
						<TagsInput
							value={sizes}
							onChange={setSizes}
							placeholder="e.g. S, M, L, XL ..."
						/>
					</div>

					<FieldDivider />

					{/* Colors */}
					<div>
						<Label text="Color Options" />
						<ColorPicker colors={selectedColors} onChange={setSelectedColors} />
						<Hint text="Add color variants if applicable (e.g. Midnight Blue, #191970)" />
					</div>

					<FieldDivider />

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
											? "bg-white shadow text-bg"
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
											? "bg-white shadow text-bg"
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
								setLaunchDate(v ? new Date() : null);
							}}
							label="Make this piece live immediately"
						/>
					</div>
				</Group>

				{/* 5. Visuals */}
				<Group>
					<Label text="Main Product Visual" required />
					<SingleImagePicker file={mainFile} onPick={setMainFile} />
					<Hint text="This is the first image people see" />

					<div className="mt-6">
						<Label text="Gallery Shots" />
						<MultiImagePicker files={galleryFiles} onPick={setGalleryFiles} />
						<Hint text="Extra angles or details (up to 4)" />
					</div>
					<div className="mt-6">
						<Label text="Size Guide" />
						<SingleImagePicker file={sizeGuideFile} onPick={setSizeGuideFile} />
						<Hint text="Upload a size guide image to help customers choose the right size" />
					</div>
				</Group>

				{/* 6. Story */}
				<Group>
					<Label text="Description" />
					<Textarea
						value={description}
						onChange={setDescription}
						placeholder="Tell the story behind this piece. Inspiration, process, or meaning — anything you want people to feel."
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
					<Hint text="Helps people discover your piece" />
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

			{/* Sticky footer */}
			<div className="fixed inset-x-0 bottom-0 bg-bg/80 backdrop-blur border-t border-stroke px-4 sm:px-6 py-3">
				<div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
					<Button
						text="Cancel"
						onClick={() => router.back()}
						variant="secondary"
						className="text-text-muted hover:text-text"
					/>
					<Button
						text={saving ? "Dropping..." : "Drop Product"}
						onClick={onCreate}
						disabled={isDisabled || saving}
						variant="primary"
					/>
				</div>
			</div>

			{err && (
				<div className="fixed left-1/2 -translate-x-1/2 bottom-20 bg-alert/10 text-alert px-4 py-2 rounded-xl border border-alert/20">
					{err}
				</div>
			)}

			{/* Radar Promotion Popup */}
			{showRadarPopup && createdPieceData && (
				<RadarPromotionPopup
					isOpen={showRadarPopup}
					onClose={() => {
						setShowRadarPopup(false);
						setCreatedPieceData(null);
						router.push("/pieces");
					}}
					onSuccess={() => {
						setShowRadarPopup(false);
						setCreatedPieceData(null);
						router.push("/radar");
					}}
					pieceData={createdPieceData}
				/>
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
	onPick,
}: {
	file: File | null;
	onPick: (f: File | null) => void;
}) {
	return (
		<div className="w-full max-w-xs">
			<label
				className="block w-full relative cursor-pointer rounded-xl border-2 border-dashed border-stroke hover:border-text transition-colors overflow-hidden group bg-surface hover:bg-surface/80"
				style={{ aspectRatio: "1/1" }}
			>
				{file ? (
					<>
						<img
							src={URL.createObjectURL(file)}
							alt=""
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
								Change Image
							</span>
						</div>
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
				/>
			</label>
		</div>
	);
}

function MultiImagePicker({
	files,
	onPick,
}: {
	files: File[];
	onPick: (next: File[]) => void;
}) {
	const MAX = 4;
	const total = files.length;
	const slotsLeft = Math.max(0, MAX - total);

	function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
		const picked = Array.from(e.target.files ?? []);
		if (!picked.length) return;
		const take = picked.slice(0, slotsLeft);
		onPick([...files, ...take]);
		e.currentTarget.value = "";
	}

	return (
		<div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
			{/* Existing Images */}
			{files.map((f, i) => {
				const url = URL.createObjectURL(f);
				return (
					<div
						key={`${f.name}-${i}`}
						className="relative rounded-xl border border-stroke overflow-hidden group"
						style={{ aspectRatio: "1/1" }}
					>
						<img src={url} alt="" className="w-full h-full object-cover" />
						<button
							type="button"
							className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
							onClick={() => onPick(files.filter((_, idx) => idx !== i))}
						>
							<span className="sr-only">Remove</span>
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
