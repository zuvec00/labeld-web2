/* /app/brand/piece/[id]/edit/page.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatWithCommasDouble, getCurrencyFromMap } from "@/lib/format";
import {
	fetchProductById,
	updateDropProduct,
	type Product,
	deleteDropProduct,
} from "@/lib/firebase/queries/product";
import { getCollectionListForBrand } from "@/lib/firebase/queries/collection";
import { uploadFileGetURL } from "@/lib/storage/upload";

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
	const [onlineMain, setOnlineMain] = useState<string>("");
	const [onlineGallery, setOnlineGallery] = useState<string[]>([]);

	const [description, setDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [sizes, setSizes] = useState<string[]>([]);
	const [copLink, setCopLink] = useState("");

	// load
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const p = await fetchProductById(id);
				if (!mounted) return;
				if (!p) {
					setErr("Piece not found.");
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
					}))
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

				setDescription(p.description ?? "");
				setTags(p.styleTags ?? []);
				setSizes(p.sizeOptions ?? []);
				setCopLink(p.copLink ?? "");
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
				mainVisualUrl = await uploadFileGetURL(
					mainFile,
					`productImages/${userId}/${Date.now()}-${mainFile.name}`
				);
			}

			let galleryImageUrls: string[] | undefined;
			if (galleryFiles.length) {
				const urls = await Promise.all(
					galleryFiles.map((f) =>
						uploadFileGetURL(
							f,
							`productImages/${userId}/${Date.now()}-${f.name}`
						)
					)
				);
				galleryImageUrls = [...urls];
			} else if (onlineGallery?.length) {
				galleryImageUrls = [...onlineGallery];
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
				mainVisualUrl,
				galleryImages: galleryImageUrls ?? null,
				description: description.trim() ? description.trim() : null,
				styleTags: tags.length ? tags : null,
				sizeOptions: sizes.length ? sizes : null,
				copLink: copLink.trim() ? copLink.trim() : null,
			};

			Object.keys(updatedData).forEach((k) => {
				if (updatedData[k] === undefined) delete updatedData[k];
			});

			await updateDropProduct(product.id, updatedData);
			router.push(`/brand/pieces/${product.id}`);
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
					<p className="text-text-muted mb-4">{err ?? "Piece not found"}</p>
					<Button text="Back" onClick={() => router.back()} />
				</div>
			</div>
		);
	}

	return (
		<div className="pb-24">
			<div className="px-4 sm:px-6 pt-6">
				<h1 className="font-heading font-semibold text-2xl">Edit Piece</h1>
				<p className="text-text-muted mt-1">Update your piece details below.</p>
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
									if (v) setLaunchDate(new Date());
								}}
								label="Available Now"
							/>
						</div>
					</div>
				</Group>

				{/* Images */}
				<Group>
					<Label text="Main Piece Visual" required />
					<SingleImagePicker
						existingUrl={onlineMain}
						file={mainFile}
						onPick={(f) => setMainFile(f)}
						onClear={() => {
							setMainFile(null);
							setOnlineMain(""); // force re-upload if removing current
						}}
					/>

					<div className="mt-4">
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

				{/* Sizes */}
				<Group>
					<Label text="Size Options" />
					<TagsInput
						value={sizes}
						onChange={setSizes}
						placeholder="e.g. S, M, L, XL..."
					/>
				</Group>

				{/* Cop link */}
				<Group>
					<Label text="Cop Link" />
					<Input
						value={copLink}
						onChange={setCopLink}
						placeholder="Paste the link where fans can cop this piece"
					/>
				</Group>

				<div className="h-16" />
			</div>

			{/* Sticky footer with Save + Delete */}
			<div className="fixed inset-x-0 bottom-0 bg-bg/80 backdrop-blur border-t border-stroke px-4 sm:px-6 py-3">
				<div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
					<Button
						text={deleting ? "Deleting…" : "Delete Piece"}
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
		<div className="flex flex-col gap-3">
			{existingUrl ? (
				<div className="relative w-full">
					<img
						src={existingUrl}
						alt=""
						className="w-full max-h-72 object-cover rounded-xl border border-stroke"
					/>
					<div className="mt-2 flex gap-2">
						<button
							type="button"
							className={
								baseFieldClasses() + " !py-1.5 !px-3 inline-block w-auto"
							}
							onClick={onClear}
						>
							Remove current
						</button>
					</div>
				</div>
			) : file ? (
				<div>
					<img
						src={URL.createObjectURL(file)}
						alt=""
						className="w-full max-h-72 object-cover rounded-xl border border-stroke"
					/>
				</div>
			) : (
				<div className="rounded-xl border border-dashed border-stroke p-4 text-center bg-surface">
					<p className="text-text-muted">No image selected</p>
				</div>
			)}
			<input
				type="file"
				accept="image/*"
				onChange={(e) => onPick(e.target.files?.[0] ?? null)}
			/>
		</div>
	);
}

/* -------- Flutter-parity gallery picker: dashed, cap 4, clear/remove ------ */

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
				} allowed (max ${MAX}).`
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
		<div className="rounded-2xl border border-stroke bg-surface p-6">
			<label className="block">
				<div className="border border-dashed border-stroke/70 rounded-xl p-4 text-center cursor-pointer hover:bg-bg">
					<div className="text-sm text-text">
						Upload extra angles, close-ups, or detail shots to show off the
						piece&apos;s vibe.
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

			{(existingUrls.length > 0 || files.length > 0) && (
				<>
					<div className="mt-3 h-16 overflow-x-auto">
						<div className="flex items-center gap-2">
							{existingUrls.map((u) => (
								<div key={u} className="relative">
									<img
										src={u}
										alt=""
										className="h-16 w-16 rounded-lg object-cover border border-stroke"
									/>
									<button
										type="button"
										className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/75 text-white text-sm leading-6"
										title="Remove"
										onClick={() => onRemoveExisting(u)}
									>
										×
									</button>
								</div>
							))}
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
											onClick={() => removeLocalAt(i)}
										>
											×
										</button>
									</div>
								);
							})}
						</div>
					</div>

					<div className="mt-2 flex items-center gap-3">
						{files.length > 0 && (
							<button
								type="button"
								onClick={() => onPick([])}
								className="text-alert text-sm border border-alert/30 rounded-lg px-2.5 py-1 hover:bg-alert/5"
							>
								Clear local
							</button>
						)}
						{existingUrls.length > 0 && (
							<button
								type="button"
								onClick={onClearExisting}
								className="text-alert text-sm border border-alert/30 rounded-lg px-2.5 py-1 hover:bg-alert/5"
							>
								Clear current
							</button>
						)}
					</div>
				</>
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
