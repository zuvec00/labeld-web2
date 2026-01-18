import React, { useState, useEffect, useMemo } from "react";
import Button from "@/components/ui/button";
import { StorefrontSection } from "@/lib/models/site-customization";
import { Lock, RotateCcw, AlertCircle, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/app/hooks/use-toast";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { uploadBrandImageWeb } from "@/lib/storage/upload";
import UploadImage from "@/components/ui/upload-image";
import { MultiImagePicker } from "@/components/ui/upload-multiple-image"; // Ensure this matches export
import { cn } from "@/lib/utils";
import PreviewFooter from "./preview/PreviewFooter";
import PreviewSocialProof from "./preview/PreviewSocialProof";
import PreviewBrandStory from "./preview/PreviewBrandStory";
import PreviewProductListing from "./preview/PreviewProductListing";
import PreviewFeaturedDrops from "./preview/PreviewFeaturedDrops";
import PreviewHero from "./preview/PreviewHero";
import { getProductListForBrand } from "@/lib/firebase/queries/product";
import { formatWithCommasDouble } from "@/lib/format";

interface SectionInspectorProps {
	section: StorefrontSection;
	defaults: StorefrontSection;
	overrides?: Record<string, any>;
	isPro: boolean;
	isSaving: boolean;
	onSave: (sectionId: string, updates: Record<string, any>) => void;
	onLockedAction: () => void;
}

// Internal Helper for Consistent Control UI
const ControlWrapper = ({
	label,
	isCustom,
	onReset,
	children,
}: {
	label: string;
	isCustom: boolean;
	onReset: () => void;
	children: React.ReactNode;
}) => {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<label className="text-xs font-medium text-text-muted uppercase tracking-wider">
					{label}
				</label>
				<div className="flex items-center gap-2">
					{isCustom ? (
						<span className="text-[10px] font-bold text-accent px-1.5 py-0.5 bg-accent/10 rounded">
							Custom
						</span>
					) : (
						<span className="text-[10px] font-medium text-text-muted/50 px-1.5 py-0.5 bg-surface-2 rounded">
							Default
						</span>
					)}
					{isCustom && (
						<button
							onClick={onReset}
							className="text-text-muted hover:text-text transition-colors p-1 hover:bg-surface-2 rounded"
							title="Reset to default"
						>
							<RotateCcw className="w-3 h-3" />
						</button>
					)}
				</div>
			</div>
			{children}
		</div>
	);
};

// Internal Product Picker Component
const ProductPicker = ({
	selectedIds = [],
	onSelectionChange,
	maxItems = 10,
	products,
}: {
	selectedIds: string[];
	onSelectionChange: (ids: string[]) => void;
	maxItems?: number;
	products: { id: string; name: string; price: string; image: string }[];
}) => {
	const handleToggle = (id: string) => {
		let newIds = [...selectedIds];
		if (newIds.includes(id)) {
			newIds = newIds.filter((pid) => pid !== id);
		} else {
			if (newIds.length >= maxItems) return; // Cap
			newIds.push(id);
		}
		onSelectionChange(newIds);
	};

	return (
		<div className="border border-stroke rounded-xl overflow-hidden bg-surface">
			<div className="p-3 border-b border-stroke bg-surface-2 flex items-center gap-2">
				<Search className="w-4 h-4 text-text-muted" />
				<span className="text-xs text-text-muted">Search products...</span>
			</div>
			<div className="max-h-[200px] overflow-y-auto p-1">
				{products.length === 0 && (
					<div className="p-4 text-center text-xs text-text-muted">
						No products found. Add pieces in your dashboard.
					</div>
				)}
				{products.map((prod) => {
					const isSelected = selectedIds.includes(prod.id);
					return (
						<div
							key={prod.id}
							onClick={() => handleToggle(prod.id)}
							className={cn(
								"flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border border-transparent",
								isSelected ? "bg-accent/5 border-accent/20" : "hover:bg-bg"
							)}
						>
							<div className="w-10 h-10 rounded bg-stroke/20 overflow-hidden relative flex-shrink-0">
								<img
									src={prod.image}
									alt={prod.name}
									className="object-cover w-full h-full"
								/>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-text truncate">
									{prod.name}
								</p>
								<p className="text-xs text-text-muted">{prod.price}</p>
							</div>
							<div
								className={cn(
									"w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
									isSelected ? "bg-accent border-accent" : "border-stroke"
								)}
							>
								{isSelected && <Check className="w-3 h-3 text-white" />}
							</div>
						</div>
					);
				})}
			</div>
			<div className="p-2 border-t border-stroke text-xs text-center text-text-muted">
				{selectedIds.length} / {maxItems} selected
			</div>
		</div>
	);
};

// Internal Collection Picker Component
const CollectionPicker = ({
	selectedIds = [],
	onSelectionChange,
	maxItems = 10,
	collections,
}: {
	selectedIds: string[];
	onSelectionChange: (ids: string[]) => void;
	maxItems?: number;
	collections: {
		id: string;
		name: string;
		status: string;
		image: string;
		launchDate: Date | null;
	}[];
}) => {
	const handleToggle = (id: string) => {
		let newIds = [...selectedIds];
		if (newIds.includes(id)) {
			newIds = newIds.filter((cid) => cid !== id);
		} else {
			if (newIds.length >= maxItems) return; // Cap
			newIds.push(id);
		}
		onSelectionChange(newIds);
	};

	return (
		<div className="border border-stroke rounded-xl overflow-hidden bg-surface">
			<div className="p-3 border-b border-stroke bg-surface-2 flex items-center gap-2">
				<Search className="w-4 h-4 text-text-muted" />
				<span className="text-xs text-text-muted">Search collections...</span>
			</div>
			<div className="max-h-[200px] overflow-y-auto p-1">
				{collections.length === 0 && (
					<div className="p-4 text-center text-xs text-text-muted">
						No collections found. Create a drop in your dashboard.
					</div>
				)}
				{collections.map((col) => {
					const isSelected = selectedIds.includes(col.id);
					return (
						<div
							key={col.id}
							onClick={() => handleToggle(col.id)}
							className={cn(
								"flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border border-transparent",
								isSelected ? "bg-accent/5 border-accent/20" : "hover:bg-bg"
							)}
						>
							<div className="w-10 h-10 rounded bg-stroke/20 overflow-hidden relative flex-shrink-0">
								{col.image ? (
									<img
										src={col.image}
										alt={col.name}
										className="object-cover w-full h-full"
									/>
								) : (
									<div className="w-full h-full bg-surface-3" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-text truncate">
									{col.name}
								</p>
								<p className="text-xs text-text-muted">{col.status}</p>
							</div>
							<div
								className={cn(
									"w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
									isSelected ? "bg-accent border-accent" : "border-stroke"
								)}
							>
								{isSelected && <Check className="w-3 h-3 text-white" />}
							</div>
						</div>
					);
				})}
			</div>
			<div className="p-2 border-t border-stroke text-xs text-center text-text-muted">
				{selectedIds.length} / {maxItems} selected
			</div>
		</div>
	);
};

export default function SectionInspector({
	section,
	defaults,
	overrides,
	isPro,
	isSaving,
	onSave,
	onLockedAction,
}: SectionInspectorProps) {
	const { user } = useDashboardContext();
	const { toast } = useToast();
	const [localOverrides, setLocalOverrides] = useState(overrides || {});
	const [uploading, setUploading] = useState(false);

	// Configurable Products State
	const [products, setProducts] = useState<
		{
			id: string;
			name: string;
			price: string;
			image: string;
			discountPercent: number | null;
			sizeOptions: string[];
			originalPrice: number;
		}[]
	>([]);

	// Configurable Collections State
	const [collections, setCollections] = useState<
		{
			id: string;
			name: string;
			status: string;
			image: string;
			launchDate: Date | null;
		}[]
	>([]);

	useEffect(() => {
		if (!user?.uid) return;

		async function loadData() {
			try {
				// Load Products
				const productList = await getProductListForBrand(user!.uid);
				const mappedProducts = productList.map((p) => ({
					id: p.id,
					name: p.dropName,
					price: `₦${formatWithCommasDouble(p.price)}`,
					image: p.mainVisualUrl,
					discountPercent: p.discountPercent || null,
					sizeOptions: p.sizeOptions || [],
					originalPrice: p.price,
				}));
				setProducts(mappedProducts);

				// Load Collections
				// We need to import this dynamically or move import to top if possible,
				// but for now relying on existing import instructions or adding it.
				// Assuming getCollectionListForBrand is available from import update.
				const { getCollectionListForBrand } = await import(
					"@/lib/firebase/queries/collection"
				);
				const collectionList = await getCollectionListForBrand(user!.uid);

				const now = new Date();
				const today = new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate()
				);

				const mappedCollections = collectionList.map((c: any) => {
					// Simple status logic for picker preview
					let status = "Upcoming";
					const launchDate = c.launchDate
						? c.launchDate.toDate
							? c.launchDate.toDate()
							: new Date(c.launchDate)
						: null;

					if (launchDate) {
						const dayLaunch = new Date(
							launchDate.getFullYear(),
							launchDate.getMonth(),
							launchDate.getDate()
						);
						const daysDiff = Math.floor(
							(dayLaunch.getTime() - today.getTime()) / 86400000
						);

						if (daysDiff > 0) status = `Drops in ${daysDiff}d`;
						else if (daysDiff === 0) status = "Drops Today";
						else status = "Dropped";
					}

					return {
						id: c.id,
						name: c.name,
						status: status,
						image: c.mainImageUrl || "",
						launchDate: launchDate,
					};
				});
				setCollections(mappedCollections);
			} catch (err) {
				console.error("Failed to load data for picker", err);
			}
		}

		loadData();
	}, [user?.uid]);

	// Sync local state
	useEffect(() => {
		setLocalOverrides(overrides || {});
	}, [section.id, overrides]);

	const handleChange = (field: string, value: any) => {
		const newOverrides = {
			...localOverrides,
			[field]: value,
		};
		setLocalOverrides(newOverrides);
	};

	const handleSave = (field?: string, value?: any) => {
		// We save the full localOverrides object to ensure consistency
		// If specific field/value not passed, save current local state
		const stateToSave =
			field && value !== undefined
				? { ...localOverrides, [field]: value }
				: localOverrides;

		onSave(section.id, stateToSave);
	};

	const handleBlur = () => {
		handleSave();
	};

	const handleReset = (field: string) => {
		const resetState = { ...localOverrides, [field]: null };
		setLocalOverrides(resetState);
		onSave(section.id, resetState);
	};

	// Check if a field is custom (overridden and not null)
	const isCustom = (field: string) => {
		return (
			localOverrides[field] !== undefined && localOverrides[field] !== null
		);
	};

	// Calculate Merged Section for Live Preview
	const previewSection = useMemo(() => {
		return {
			...defaults,
			...section, // Keep instance props like ID/Enabled
			...localOverrides, // Apply overrides
		};
	}, [defaults, section, localOverrides]);

	const renderPreview = () => {
		switch (section.type) {
			case "hero":
				return <PreviewHero section={previewSection as any} />;
			case "featuredDrops":
				return (
					<PreviewFeaturedDrops
						section={previewSection as any}
						collectionsLookup={collections}
					/>
				);
			case "productListing":
				return (
					<PreviewProductListing
						section={previewSection as any}
						products={products}
					/>
				);
			case "brandStory":
				return <PreviewBrandStory section={previewSection as any} />;
			case "socialProof":
				return <PreviewSocialProof section={previewSection as any} />;
			case "footer":
				return <PreviewFooter section={previewSection as any} />;
			default:
				return null;
		}
	};

	// File Upload Handler for Single Image
	const handleImageUpload = async (file: File | null) => {
		if (!file) return; // Clearing handled by other means or explicit null
		if (!user?.uid) return;

		try {
			setUploading(true);
			const url = await uploadBrandImageWeb(file, user.uid);
			handleChange("imageUrl", url);
			handleSave("imageUrl", url); // Immediate save
			toast({ title: "Image Uploaded" });
		} catch (error) {
			console.error(error);
			toast({ title: "Upload Failed", variant: "destructive" });
		} finally {
			setUploading(false);
		}
	};

	// Handler for Multi Image
	const handleMultiUpload = async (files: File[]) => {
		if (!user?.uid) return;
		// This is tricky because MultiImagePicker calls this with NEW files.
		// We probably need to upload them one by one and append URLs.
		// But MultiImagePicker in our codebase handles local files vs existing URLs.
		// We need to adapt logic: Upload new files immediately, add to `images` array.

		try {
			setUploading(true);
			const uploadPromises = files.map((f) => uploadBrandImageWeb(f, user.uid));
			const newUrls = await Promise.all(uploadPromises);

			const currentUrls = localOverrides.images || [];
			const updatedUrls = [...currentUrls, ...newUrls];

			handleChange("images", updatedUrls);
			handleSave("images", updatedUrls);
		} catch (error) {
			toast({ title: "Upload Failed", variant: "destructive" });
		} finally {
			setUploading(false);
		}
	};

	const handleRemoveMultiImage = (urlToRemove: string) => {
		const currentUrls = (localOverrides.images || []) as string[];
		const updatedUrls = currentUrls.filter((u) => u !== urlToRemove);
		handleChange("images", updatedUrls);
		handleSave("images", updatedUrls);
	};

	if (!section.enabled && !section.isRequired) {
		return (
			<div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-muted border-l border-stroke bg-surface/50">
				<p className="max-w-[200px]">
					Enable this section to edit its content.
				</p>
			</div>
		);
	}

	if (!isPro) {
		return (
			<div className="h-full flex flex-col items-center justify-center p-8 text-center border-l border-stroke bg-surface/50 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 pointer-events-none" />
				<Lock className="w-8 h-8 text-text-muted mb-4 opacity-50" />
				<h3 className="text-text font-semibold mb-2">Pro Feature</h3>
				<p className="text-text-muted text-sm mb-6 max-w-[240px]">
					Content customization is available on the Pro plan.
				</p>
				<Button text="Upgrade to Customize" onClick={onLockedAction} />
			</div>
		);
	}

	// Auto-fetch Social Handle if empty
	const [isFetchingHandle, setIsFetchingHandle] = useState(false);
	const hasFetchedHandleRef = React.useRef<string | null>(null);

	useEffect(() => {
		if (section.type === "socialProof" && user?.uid) {
			const currentHandle = localOverrides.handle;
			// Only fetch if we haven't fetched for this section session yet and no handle is set
			if (
				hasFetchedHandleRef.current !== section.id &&
				(currentHandle === undefined || currentHandle === "")
			) {
				hasFetchedHandleRef.current = section.id;
				setIsFetchingHandle(true);

				import("@/lib/firebase/queries/brandspace")
					.then(({ fetchBrandDoc }) => {
						fetchBrandDoc(user.uid).then((brand) => {
							if (brand?.instagram) {
								const raw = brand.instagram;
								const handle = raw.includes("instagram.com/")
									? raw.split("instagram.com/")[1].split("/")[0].split("?")[0]
									: raw;
								const final = handle.startsWith("@") ? handle : `@${handle}`;

								// Update if still empty (don't overwrite if user started typing)
								// Since we're in a closure, we trust the async flow or check ref/state if needed
								// but here we'll just apply it.
								handleChange("handle", final);
								handleSave("handle", final);
							}
							setIsFetchingHandle(false);
						});
					})
					.catch(() => setIsFetchingHandle(false));
			}
		}
	}, [section.type, section.id, user?.uid]); // simplified deps

	const renderFields = () => {
		switch (section.type) {
			case "hero":
				return (
					<div className="space-y-6">
						{/* Live Hint */}
						<div className="flex items-center gap-2 px-3 py-2 bg-accent/5 border border-accent/20 rounded text-accent text-xs mb-4">
							<AlertCircle className="w-3.5 h-3.5" />
							<span>Changes are live on your site immediately.</span>
						</div>

						<ControlWrapper
							label="Background Image (Optional)"
							isCustom={isCustom("imageUrl")}
							onReset={() => handleReset("imageUrl")}
						>
							<UploadImage
								text="Cover Image"
								value={null} // Controlled upload handled manually
								onChange={handleImageUpload}
								onlineImage={
									localOverrides.imageUrl ?? (defaults as any).imageUrl
								}
								singleImage={true}
								backgroundColor="var(--color-bg)"
								textColor="var(--color-text-muted)"
							/>
						</ControlWrapper>

						<ControlWrapper
							label="Headline"
							isCustom={isCustom("headline")}
							onReset={() => handleReset("headline")}
						>
							<Input
								value={
									localOverrides.headline ?? (defaults as any).headline ?? ""
								}
								onChange={(e) => handleChange("headline", e.target.value)}
								onBlur={handleBlur}
								placeholder="e.g. New Arrivals"
								className="bg-surface"
							/>
						</ControlWrapper>

						<ControlWrapper
							label="Subheadline"
							isCustom={isCustom("subheadline")}
							onReset={() => handleReset("subheadline")}
						>
							<Textarea
								value={
									localOverrides.subheadline ??
									(defaults as any).subheadline ??
									""
								}
								onChange={(e) => handleChange("subheadline", e.target.value)}
								onBlur={handleBlur}
								placeholder="e.g. Best sellers for the season"
								className="bg-surface min-h-[80px]"
							/>
						</ControlWrapper>

						{(defaults as any).primaryCta && (
							<ControlWrapper
								label="CTA Label"
								isCustom={isCustom("primaryCtaLabel")}
								onReset={() => handleReset("primaryCtaLabel")}
							>
								<Input
									value={
										localOverrides.primaryCtaLabel ??
										(defaults as any).primaryCta?.label ??
										""
									}
									onChange={(e) =>
										handleChange("primaryCtaLabel", e.target.value)
									}
									onBlur={handleBlur}
									placeholder="e.g. Shop Now"
									className="bg-surface"
								/>
							</ControlWrapper>
						)}
					</div>
				);

			case "brandStory":
				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Title"
							isCustom={isCustom("title")}
							onReset={() => handleReset("title")}
						>
							<Input
								value={localOverrides.title ?? (defaults as any).title ?? ""}
								onChange={(e) => handleChange("title", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
							/>
						</ControlWrapper>

						<ControlWrapper
							label="Content"
							isCustom={isCustom("content")}
							onReset={() => handleReset("content")}
						>
							<Textarea
								value={
									localOverrides.content ?? (defaults as any).content ?? ""
								}
								onChange={(e) => handleChange("content", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface min-h-[120px]"
							/>
						</ControlWrapper>
					</div>
				);

			case "featuredDrops":
				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Title"
							isCustom={isCustom("title")}
							onReset={() => handleReset("title")}
						>
							<Input
								value={localOverrides.title ?? (defaults as any).title ?? ""}
								onChange={(e) => handleChange("title", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
							/>
						</ControlWrapper>

						<ControlWrapper
							label="Subtitle (Optional)"
							isCustom={isCustom("subtitle")}
							onReset={() => handleReset("subtitle")}
						>
							<Input
								value={
									localOverrides.subtitle ?? (defaults as any).subtitle ?? ""
								}
								onChange={(e) => handleChange("subtitle", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
							/>
						</ControlWrapper>

						<ControlWrapper
							label="Featured Collections (Drops)"
							isCustom={isCustom("collectionIds")}
							onReset={() => handleReset("collectionIds")}
						>
							<CollectionPicker
								selectedIds={localOverrides.collectionIds || []}
								onSelectionChange={(ids) => {
									handleChange("collectionIds", ids);
									handleSave("collectionIds", ids);
								}}
								maxItems={(defaults as any).maxItems || 4}
								collections={collections}
							/>
						</ControlWrapper>

						<ControlWrapper
							label="Drop Status Format"
							isCustom={isCustom("dropStatusMode")}
							onReset={() => handleReset("dropStatusMode")}
						>
							<select
								className="w-full h-10 px-3 rounded-md border border-stroke bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
								value={localOverrides.dropStatusMode ?? "relative"}
								onChange={(e) => {
									handleChange("dropStatusMode", e.target.value);
									handleSave("dropStatusMode", e.target.value);
								}}
							>
								<option value="relative">Relative (e.g. Drops in 2d)</option>
								<option value="date">Date (e.g. 01/15)</option>
							</select>
						</ControlWrapper>

						<ControlWrapper
							label="Card Subtext"
							isCustom={isCustom("cardSubtext")}
							onReset={() => handleReset("cardSubtext")}
						>
							<Input
								value={localOverrides.cardSubtext ?? "Exclusive access via App"}
								onChange={(e) => handleChange("cardSubtext", e.target.value)}
								onBlur={handleBlur}
								placeholder="e.g. Exclusive access via App"
								className={cn(
									"bg-surface",
									localOverrides.cardSubtext === "" && "text-text-muted italic"
								)}
							/>
							{localOverrides.cardSubtext === "" && (
								<p className="text-[10px] text-text-muted pt-1">
									Subtext is hidden.
								</p>
							)}
						</ControlWrapper>
					</div>
				);

			case "productListing":
				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Section Title"
							isCustom={isCustom("title")}
							onReset={() => handleReset("title")}
						>
							<Input
								value={localOverrides.title ?? "Shop Collection"}
								onChange={(e) => handleChange("title", e.target.value)}
								onBlur={handleBlur}
								placeholder="e.g. Shop Collection (Leave empty to hide)"
								className={cn(
									"bg-surface",
									localOverrides.title === "" && "text-text-muted italic"
								)}
							/>
							{localOverrides.title === "" && (
								<p className="text-[10px] text-text-muted pt-1">
									Title is hidden.
								</p>
							)}
						</ControlWrapper>

						<ControlWrapper
							label="Sort Order"
							isCustom={isCustom("order")}
							onReset={() => handleReset("order")}
						>
							<select
								className="w-full h-10 px-3 rounded-md border border-stroke bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
								value={localOverrides.order ?? "latest"}
								onChange={(e) => {
									handleChange("order", e.target.value);
									handleSave("order", e.target.value); // Immediate save
								}}
							>
								<option value="latest">Latest Arrivals</option>
								<option value="price_asc">Price: Low to High</option>
								<option value="price_desc">Price: High to Low</option>
								<option value="random">Randomize</option>
							</select>
						</ControlWrapper>

						<div className="border-t border-stroke pt-4">
							<div className="flex items-center justify-between mb-4">
								<label className="text-xs font-medium text-text-muted uppercase tracking-wider">
									Manual Selection
								</label>
								<Switch
									checked={!!localOverrides.manualSelection}
									onCheckedChange={(checked) => {
										handleChange("manualSelection", checked);
										// If turning on, maybe init products?
										if (!checked) handleReset("productIds");
										handleSave("manualSelection", checked);
									}}
								/>
							</div>

							{localOverrides.manualSelection && (
								<ControlWrapper
									label="Select Products"
									isCustom={isCustom("productIds")}
									onReset={() => handleReset("productIds")}
								>
									<ProductPicker
										selectedIds={localOverrides.productIds || []}
										onSelectionChange={(ids) => {
											handleChange("productIds", ids);
											handleSave("productIds", ids);
										}}
										maxItems={12}
										products={products}
									/>
								</ControlWrapper>
							)}
						</div>
					</div>
				);

			case "socialProof":
				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Platform"
							isCustom={isCustom("platform")}
							onReset={() => handleReset("platform")}
						>
							<select
								className="w-full h-10 px-3 rounded-md border border-stroke bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
								value={localOverrides.platform ?? "instagram"}
								onChange={(e) => {
									handleChange("platform", e.target.value);
									handleSave("platform", e.target.value);
								}}
							>
								<option value="instagram">Instagram</option>
								<option value="tiktok" disabled>
									TikTok (Coming Soon)
								</option>
							</select>
						</ControlWrapper>

						<ControlWrapper
							label="Social Handle"
							isCustom={isCustom("handle")}
							onReset={() => handleReset("handle")}
						>
							<div className="relative">
								<Input
									value={localOverrides.handle ?? ""}
									onChange={(e) => {
										const rawHandle = e.target.value;
										handleChange("handle", rawHandle);
									}}
									onBlur={(e) => {
										const rawHandle = e.target.value;
										if (!rawHandle) {
											handleBlur();
											return;
										}
										const handle = rawHandle.includes("instagram.com/")
											? rawHandle
													.split("instagram.com/")[1]
													.split("/")[0]
													.split("?")[0]
											: rawHandle;
										const finalHandle = handle.startsWith("@")
											? handle
											: `@${handle}`;
										handleChange("handle", finalHandle);
										handleSave("handle", finalHandle);
									}}
									placeholder={
										isFetchingHandle ? "Fetching from profile..." : "@yourbrand"
									}
									className="bg-surface disabled:opacity-50"
									disabled={isFetchingHandle && !localOverrides.handle}
								/>
								{isFetchingHandle && (
									<div className="absolute right-3 top-1/2 -translate-y-1/2">
										<RotateCcw className="w-3 h-3 text-accent animate-spin" />
									</div>
								)}
							</div>
							<p className="text-[10px] text-text-muted pt-1 flex items-center justify-between">
								<span>Enter your handle or paste your profile link.</span>
								{isFetchingHandle && (
									<span className="text-accent">Fetching from brand...</span>
								)}
							</p>
						</ControlWrapper>

						<ControlWrapper
							label="Follower Count (Optional)"
							isCustom={isCustom("followerCount")}
							onReset={() => handleReset("followerCount")}
						>
							<Input
								type="number"
								value={localOverrides.followerCount ?? ""}
								onChange={(e) =>
									handleChange(
										"followerCount",
										e.target.value ? parseInt(e.target.value) : null
									)
								}
								onBlur={handleBlur}
								placeholder="e.g. 12500"
								className="bg-surface"
							/>
							<p className="text-[10px] text-text-muted pt-1">
								Shown as social proof. Leave empty to hide.
							</p>
						</ControlWrapper>

						<div className="flex items-center justify-between py-2">
							<label className="text-xs font-medium text-text-muted uppercase tracking-wider">
								Show 'View on Instagram' Link
							</label>
							<Switch
								checked={localOverrides.showCta ?? true}
								onCheckedChange={(checked) => {
									handleChange("showCta", checked);
									handleSave("showCta", checked);
								}}
							/>
						</div>

						<ControlWrapper
							label="Images"
							isCustom={isCustom("images")}
							onReset={() => handleReset("images")}
						>
							<MultiImagePicker
								existingUrls={localOverrides.images || []}
								files={[]} // We handle uploads visually immediately, so no local pending files for this V1 wrapper
								onPick={handleMultiUpload} // Handle new files
								onClearExisting={() => {
									handleChange("images", []);
									handleSave("images", []);
								}}
								onRemoveExisting={handleRemoveMultiImage}
								maxFiles={6}
								description="Choose 3-6 recent posts, customer photos, or campaign visuals."
							/>
						</ControlWrapper>
					</div>
				);

			case "footer":
				return (
					<div className="py-8 text-center text-text-muted text-sm">
						Footer content is managed globally via Brand Identity.
					</div>
				);

			default:
				return (
					<div className="py-8 text-center text-text-muted text-sm">
						No customizable content for this section type.
					</div>
				);
		}
	};

	return (
		<div className="h-full border-l border-stroke bg-surface/30 flex flex-col">
			{/* Live Preview Block */}
			<div className="bg-bg border-b border-stroke overflow-hidden flex-shrink-0 max-h-[40vh] overflow-y-auto">
				{renderPreview()}
			</div>

			<div className="p-4 border-b border-stroke flex items-center justify-between bg-surface">
				<h3 className="font-medium text-text text-sm">
					Edit Content: {section.type}
				</h3>
				{(isSaving || uploading) && (
					<span className="text-xs text-text-muted animate-pulse flex items-center gap-1">
						{uploading && <RotateCcw className="w-3 h-3 animate-spin" />}
						{uploading ? "Uploading..." : "Saving..."}
					</span>
				)}
			</div>
			<div className="p-4 flex-1 overflow-y-auto">{renderFields()}</div>
		</div>
	);
}
