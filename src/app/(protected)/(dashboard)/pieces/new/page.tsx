/* /app/brand/piece/new/page.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatWithCommasDouble } from "@/lib/format";

import { getCollectionListForBrand } from "@/lib/firebase/queries/collection";
import { uploadFileGetURL } from "@/lib/storage/upload";
import { fetchBrandById } from "@/lib/firebase/queries/brandspace";
import { sendNotificationCF } from "@/lib/firebase/callables/users";
import { addDropProductCF } from "@/lib/firebase/queries/product";

/* ----------------------------- Currency list ---------------------------- */
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

	const [brandIG, setBrandIG] = useState<string | null>(null);
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

	const [description, setDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [sizes, setSizes] = useState<string[]>([]);
	const [copLink, setCopLink] = useState("");
	const [useInstagramLink, setUseInstagramLink] = useState(false);

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
					}))
				);
				setBrandIG(brand?.instagram ?? null);
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
	useEffect(() => {
		if (!brandIG) return;
		if (useInstagramLink) {
			const igUrl = brandIG.startsWith("http")
				? brandIG
				: `https://instagram.com/${brandIG}`;
			setCopLink(igUrl);
		}
	}, [useInstagramLink, brandIG]);

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
			const mainVisualUrl = await uploadFileGetURL(
				mainFile!,
				`productImages/${uid}/${Date.now()}-${mainFile!.name}`
			);
			// 2) upload gallery (optional, cap 4)
			let galleryImageUrls: string[] | undefined;
			if (galleryFiles.length) {
				const take = galleryFiles.slice(0, 4);
				galleryImageUrls = await Promise.all(
					take.map((f) =>
						uploadFileGetURL(f, `productImages/${uid}/${Date.now()}-${f.name}`)
					)
				);
			}

			// 3) launch date
			const launch: Date = availableNow ? new Date() : (launchDate as Date);

			// 4) build payload (Flutter parity + denormalized brand)
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
				mainVisualUrl,
				galleryImages: galleryImageUrls,
				description: description.trim() ? description.trim() : null,
				styleTags: tags.length ? tags : null,
				sizeOptions: sizes.length ? sizes : null,
				copLink: copLink.trim() ? copLink.trim() : null,
				// ⭐ denormalized brand snapshot
				brand: brandSnap ?? undefined,
			};
			Object.keys(productData).forEach(
				(k) => productData[k] == null && delete productData[k]
			);

			// 5) write via CF
			const { id } = await addDropProductCF(productData);

			// 6) optional notif (parity with Flutter)
			try {
				await sendNotificationCF({
					title: "New drop 👀",
					content: "Be the first to check it out",
					externalUserIds: [uid], // or your follower targeting on the backend
				});
			} catch {
				/* non-fatal */
			}

			// 7) route
			router.push("/pieces");
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

	return (
		<div className="pb-24">
			<div className="px-4 sm:px-6 pt-6">
				<h1 className="font-heading font-semibold text-2xl">Drop a Piece</h1>
				<p className="text-text-muted mt-1">
					Ready to show off your next masterpiece? Drop a piece and let your
					fans fall in love.
				</p>
			</div>

			<div className="px-4 sm:px-6 mt-6 space-y-4">
				{/* Link to collection */}
				<Group>
					<Label text="Link This to a Collection" />
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
				</Group>

				{/* Basic fields */}
				<Group>
					<Label text="Piece Name" required />
					<Input
						value={pieceName}
						onChange={setPieceName}
						placeholder="Camo Hoodie"
					/>

					<div className="grid grid-cols-3 gap-3 mt-3">
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

					<div className="mt-3">
						<Label text="Launch Date" required />
						<DateTimePicker value={launchDate} onChange={setLaunchDate} />
						{!!collectionId &&
							collections.find(
								(c) =>
									c.id === collectionId &&
									c.launchDate &&
									launchDate &&
									+c.launchDate! === +launchDate!
							) && <Hint text="Piece matches drop collection launch date." />}
						<div className="mt-3">
							<Toggle
								checked={availableNow}
								onChange={(v) => {
									setAvailableNow(v);
									setLaunchDate(v ? new Date() : null);
								}}
								label="Available Now"
							/>
						</div>
					</div>
				</Group>

				{/* Images */}
				<Group>
					<Label text="Main Piece Visual" required />
					<SingleImagePicker file={mainFile} onPick={setMainFile} />
					<div className="mt-4">
						<Label text="Gallery Shots" />
						<MultiImagePicker files={galleryFiles} onPick={setGalleryFiles} />
					</div>
				</Group>

				{/* Description */}
				<Group>
					<Label text="Description" />
					<Textarea
						value={description}
						onChange={setDescription}
						placeholder="Tell us the inspiration behind this piece (or anything basically)."
					/>
				</Group>

				{/* Tags */}
				<Group>
					<Label text="Piece Tags" />
					<TagsInput
						value={tags}
						onChange={setTags}
						placeholder="Add your tags"
					/>
					<Hint text="Used in explore, search and trends" />
				</Group>

				{/* Sizes (chips + free input) */}
				<Group>
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
				</Group>

				{/* Cop link (+ IG helper) */}
				<Group>
					<Label text="Cop Link" />
					<Input
						value={copLink}
						onChange={(v) => {
							setCopLink(v);
							if (useInstagramLink && brandIG) setUseInstagramLink(false);
						}}
						placeholder="Paste the link where fans can cop this piece"
					/>
					{!!brandIG && (
						<label className="flex items-center gap-2 mt-2 cursor-pointer">
							<input
								type="checkbox"
								checked={useInstagramLink}
								onChange={(e) => setUseInstagramLink(e.target.checked)}
							/>
							<span>Use my Instagram profile link</span>
						</label>
					)}
				</Group>

				<div className="h-16" />
			</div>

			{/* Sticky footer */}
			<div className="fixed inset-x-0 bottom-0 bg-bg/80 backdrop-blur border-t border-stroke px-4 sm:px-6 py-3">
				<div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
					<Button
						text={saving ? "Saving…" : "Save Your Piece"}
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
		v: { flag: string; abbreviation: string; name: string } | null
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
		<div className="flex flex-col gap-3">
			{file ? (
				<img
					src={URL.createObjectURL(file)}
					alt=""
					className="w-full max-h-72 object-cover rounded-xl border border-stroke"
				/>
			) : (
				<label className="block cursor-pointer">
					<div className="rounded-xl border border-dashed border-stroke p-4 text-center bg-surface hover:bg-bg transition-colors">
						<p className="text-text-muted">No image selected</p>
					</div>
					<input
						type="file"
						accept="image/*"
						className="sr-only"
						onChange={(e) => onPick(e.target.files?.[0] ?? null)}
					/>
				</label>
			)}
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
		<div className="rounded-2xl border border-stroke bg-surface p-6">
			<label className="block">
				<div className="border border-dashed border-stroke/70 rounded-xl p-4 text-center cursor-pointer hover:bg-bg">
					<div className="text-sm text-text">
						Upload extra angles, close-ups, or detail shots.
					</div>
					<div className="text-xs text-text-muted mt-1">
						{total} / {MAX} selected
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

			{files.length > 0 && (
				<div className="mt-3 h-16 overflow-x-auto">
					<div className="flex items-center gap-2">
						{files.map((f, i) => {
							const url = URL.createObjectURL(f);
							return (
								<div key={`${f.name}-${i}`} className="relative">
									<img
										src={url}
										alt=""
										className="h-16 w-16 rounded-lg object-cover border border-stroke"
									/>
									<button
										type="button"
										className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/75 text-white text-sm leading-6"
										title="Remove"
										onClick={() => onPick(files.filter((_, idx) => idx !== i))}
									>
										×
									</button>
								</div>
							);
						})}
					</div>
				</div>
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
