/* /app/brand/piece/[id]/edit/page.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
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
import { uploadImageCloudinary } from "@/lib/storage/cloudinary";

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

/* ---------------------------------- Page --------------------------------- */

export default function EditPiecePage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

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
	const [onlineMain, setOnlineMain] = useState<string>("");
	const [onlineGallery, setOnlineGallery] = useState<string[]>([]);
	const [onlineSizeGuide, setOnlineSizeGuide] = useState<string>("");

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
				const code = getCurrencyFromMap(p.currency) || "";
				const found = currencyList.find((c) => c.abbreviation === code) ?? null;
				setSelectedCurrency(found);

				setLaunchDate(asDate((p as any).launchDate));
				setAvailableNow(!!p.isAvailableNow);
				setCollectionId(p.dropId ?? "");

				setOnlineMain(p.mainVisualUrl || "");
				setOnlineGallery(p.galleryImages ?? []);
				setOnlineSizeGuide((p as any).sizeGuideUrl || "");

				setDescription(p.description ?? "");
				setTags(p.styleTags ?? []);
				setSizes(p.sizeOptions ?? []);
				setSelectedColors(p.colors ?? []);
				// setCopLink(p.copLink ?? "");

				// Stock management
				const stockRem = (p as any).stockRemaining;
				if (stockRem === null || stockRem === undefined) {
					setUnlimitedStock(true);
					setStockQuantity("");
				} else {
					setUnlimitedStock(false);
					setStockQuantity(String(stockRem));
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
				setErr(e?.message ?? "Failed to load piece.");
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
		!(onlineMain || mainFile);

	async function onSave() {
		if (isDisabled || !product) return;
		setSaving(true);
		setErr(null);
		try {
			const auth = getAuth();
			const userId = auth.currentUser?.uid || "anonymous";

			// upload images if replaced
			let mainVisualUrl = onlineMain;
			if (mainFile) {
				try {
					// Primary: Upload to Cloudinary
					mainVisualUrl = await uploadImageCloudinary(mainFile, {
						folder: `productImages/${userId}`,
						tags: ["product", "main", userId],
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
						mainFile,
						`productImages/${userId}/${Date.now()}-${mainFile.name}`,
					);
					console.log(
						"✅ Main product image uploaded to Firebase Storage:",
						mainVisualUrl,
					);
				}
			}

			let galleryImageUrls: string[] | undefined;
			if (galleryFiles.length) {
				galleryImageUrls = [];

				for (const f of galleryFiles) {
					try {
						// Primary: Upload to Cloudinary
						const url = await uploadImageCloudinary(f, {
							folder: `productImages/${userId}`,
							tags: ["product", "gallery", userId],
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
							`productImages/${userId}/${Date.now()}-${f.name}`,
						);
						galleryImageUrls.push(url);
						console.log(
							"✅ Gallery product image uploaded to Firebase Storage:",
							url,
						);
					}
				}
			} else if (onlineGallery?.length) {
				galleryImageUrls = [...onlineGallery];
			}

			// upload size guide if replaced
			let sizeGuideUrl = onlineSizeGuide;
			if (sizeGuideFile) {
				try {
					// Primary: Upload to Cloudinary
					sizeGuideUrl = await uploadImageCloudinary(sizeGuideFile, {
						folder: `productImages/${userId}`,
						tags: ["product", "size-guide", userId],
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
						`productImages/${userId}/${Date.now()}-${sizeGuideFile.name}`,
					);
					console.log(
						"✅ Size guide image uploaded to Firebase Storage:",
						sizeGuideUrl,
					);
				}
			}

			const launch: Date = availableNow ? new Date() : (launchDate as Date);

			const updatedData: Record<string, any> = {
				brandId: product.brandId,
				userId,
				dropId: collectionId || null,
				dropName: pieceName.trim(),
				price: parsedPrice,
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
				mainVisualUrl,
				galleryImages: galleryImageUrls ?? null,
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
		if (!confirm("Delete this piece? This cannot be undone.")) return;
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
				<p className="text-text-muted mt-1">Update your piece details below.</p>
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
						<div className="space-y-3">
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
							label="Make this piece live immediately"
						/>
					</div>
				</Group>

				{/* 5. Visuals */}
				<Group>
					<Label text="Main Product Visual" required />
					<SingleImagePicker
						existingUrl={onlineMain}
						file={mainFile}
						onPick={(f) => setMainFile(f)}
						onClear={() => {
							setMainFile(null);
							setOnlineMain(""); // force re-upload if removing current
						}}
					/>
					<Hint text="This is the first image people see" />

					<div className="mt-6">
						<Label text="Gallery Shots" />
						<MultiImagePicker
							existingUrls={onlineGallery}
							files={galleryFiles}
							onPick={(next) => setGalleryFiles(next)}
							onClearExisting={() => setOnlineGallery([])}
							onRemoveExisting={(url) =>
								setOnlineGallery((prev) => prev.filter((u) => u !== url))
							}
						/>
						<Hint text="Extra angles or details (up to 4)" />
					</div>

					<div className="mt-6">
						<Label text="Size Guide" />
						<SingleImagePicker
							existingUrl={onlineSizeGuide}
							file={sizeGuideFile}
							onPick={(f) => setSizeGuideFile(f)}
							onClear={() => {
								setSizeGuideFile(null);
								setOnlineSizeGuide("");
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
	existingUrl,
	file,
	onPick,
	onClear,
}: {
	existingUrl?: string;
	file: File | null;
	onPick: (f: File | null) => void;
	onClear: () => void;
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
							alt="Preview"
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
								Change Image
							</span>
						</div>
						<button
							type="button"
							className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-red-500 text-white transition-colors z-10 backdrop-blur-sm"
							onClick={(e) => {
								e.preventDefault();
								onPick(null);
							}}
							title="Remove"
						>
							<svg
								className="w-5 h-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</>
				) : existingUrl ? (
					<>
						<OptimizedImage
							src={existingUrl}
							alt="Current image"
							fill
							sizeContext="card"
							objectFit="cover"
							className="w-full h-full"
						/>
						<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
								Change Image
							</span>
						</div>
						<button
							type="button"
							className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-red-500 text-white transition-colors z-10 backdrop-blur-sm"
							onClick={(e) => {
								e.preventDefault();
								onClear();
							}}
							title="Remove"
						>
							<svg
								className="w-5 h-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
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

/* -------- Flutter-parity gallery picker: grid layout, cap 4, clear/remove ------ */

function MultiImagePicker({
	existingUrls,
	files,
	onPick,
	onClearExisting,
	onRemoveExisting,
}: {
	existingUrls: string[];
	files: File[];
	onPick: (next: File[]) => void;
	onClearExisting: () => void;
	onRemoveExisting: (url: string) => void;
}) {
	const MAX = 4;
	const [msg, setMsg] = useState<string | null>(null);

	const total = (existingUrls?.length || 0) + (files?.length || 0);
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
		onPick([...files, ...take]);

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

	function removeLocalAt(i: number) {
		onPick(files.filter((_, idx) => idx !== i));
	}

	return (
		<div>
			<div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
				{/* Existing Images */}
				{existingUrls.map((u) => (
					<div
						key={u}
						className="relative rounded-xl border border-stroke overflow-hidden group"
						style={{ aspectRatio: "1/1" }}
					>
						<OptimizedImage
							src={u}
							alt="Gallery image"
							fill
							sizeContext="thumbnail"
							objectFit="cover"
						/>
						<button
							type="button"
							className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
							title="Remove"
							onClick={() => onRemoveExisting(u)}
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
				))}

				{/* Local Files */}
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
								title="Remove"
								onClick={() => removeLocalAt(i)}
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

			{/* Bulk Actions (Clear) */}
			{(existingUrls.length > 0 || files.length > 0) && (
				<div className="mt-3 flex items-center gap-3">
					{files.length > 0 && (
						<button
							type="button"
							onClick={() => onPick([])}
							className="text-alert text-xs border border-alert/30 rounded-lg px-2.5 py-1.5 hover:bg-alert/5"
						>
							Clear uploads
						</button>
					)}
					{existingUrls.length > 0 && (
						<button
							type="button"
							onClick={onClearExisting}
							className="text-alert text-xs border border-alert/30 rounded-lg px-2.5 py-1.5 hover:bg-alert/5"
						>
							Clear existing
						</button>
					)}
				</div>
			)}

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
