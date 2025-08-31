/* /app/brand/collection/[id]/edit/page.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { uploadFileGetURL } from "@/lib/storage/upload";
import {
	deleteCollection,
	fetchCollectionById,
	updateCollectionCF,
} from "@/lib/firebase/queries/collection";

type CollectionDoc = {
	id: string;
	brandId: string;
	name: string;
	description?: string | null;
	mainImageUrl: string;
	galleryImageUrls?: string[];
	styleTags?: string[];
	launchDate?: any | null; // Date | Timestamp | string
	isPublished?: boolean;
	heatScore?: number;
};

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

function baseField() {
	return "w-full rounded-xl border border-stroke bg-surface px-3 py-2 outline-none focus:border-accent";
}

export default function EditCollectionPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const [doc, setDoc] = useState<CollectionDoc | null>(null);

	// fields
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [availableNow, setAvailableNow] = useState(false);
	const [launchDate, setLaunchDate] = useState<Date | null>(null);

	const [mainFile, setMainFile] = useState<File | null>(null);
	const [onlineMain, setOnlineMain] = useState<string>("");
	const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
	const [onlineGallery, setOnlineGallery] = useState<string[]>([]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const d = await fetchCollectionById(id);
				if (!mounted) return;
				if (!d) {
					setErr("Collection not found.");
					setLoading(false);
					return;
				}
				setDoc(d);
				setName(d.name ?? "");
				setDescription(d.description ?? "");
				setTags(d.styleTags ?? []);
				setAvailableNow(!!d.isPublished);
				setLaunchDate(asDate(d.launchDate));
				setOnlineMain(d.mainImageUrl || "");
				setOnlineGallery(d.galleryImageUrls ?? []);
			} catch (e: any) {
				if (!mounted) return;
				setErr(e?.message ?? "Failed to load collection.");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [id]);

	const canSave = !!name.trim();

	async function onSave() {
		if (!doc || !canSave) return;
		setSaving(true);
		setErr(null);
		try {
			const auth = getAuth();
			const uid = auth.currentUser?.uid || "anonymous";

			// main image
			let mainImageUrl = onlineMain;
			if (mainFile) {
				mainImageUrl = await uploadFileGetURL(
					mainFile,
					`dropImages/${uid}/${Date.now()}-${mainFile.name}`
				);
			}

			// gallery
			let galleryImageUrls: string[] | undefined;
			if (galleryFiles.length) {
				const urls = await Promise.all(
					galleryFiles.map((f) =>
						uploadFileGetURL(f, `dropImages/${uid}/${Date.now()}-${f.name}`)
					)
				);
				galleryImageUrls = urls;
			} else {
				galleryImageUrls = [...onlineGallery];
			}

			const updatedData: Record<string, any> = {
				brandId: doc.brandId,
				name: name.trim(),
				mainImageUrl,
				description: description.trim() || null,
				styleTags: tags.length ? tags : null,
				galleryImageUrls: galleryImageUrls ?? null,
				createdBy: uid,
				isDeleted: false,
				heatScore: doc.heatScore ?? 0,
				launchDate: availableNow ? new Date() : launchDate ?? null,
				isPublished: availableNow,
			};
			Object.keys(updatedData).forEach(
				(k) => updatedData[k] === undefined && delete updatedData[k]
			);

			await updateCollectionCF({ collectionId: doc.id, updatedData });
			router.push(`/brand-space`);
		} catch (e: any) {
			setErr(e?.message ?? "Failed to save changes.");
		} finally {
			setSaving(false);
		}
	}

	async function onDelete() {
		if (!doc) return;
		if (!confirm("Delete this collection? This cannot be undone.")) return;
		setDeleting(true);
		setErr(null);
		try {
			await deleteCollection(doc.id, doc.brandId);
			router.push("/brand/collections");
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

	if (!doc) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<p className="text-text-muted">{err ?? "Not found."}</p>
			</div>
		);
	}

	return (
		<div className="pb-24">
			<div className="px-4 sm:px-6 pt-6">
				<h1 className="font-heading font-semibold text-2xl">
					Edit Drop Collection
				</h1>
				<p className="text-text-muted mt-1">
					Update your collection details below.
				</p>
			</div>

			<div className="px-4 sm:px-6 mt-6 space-y-4">
				{/* Group: name / main visual / description / tags */}
				<Group>
					<Label text="Collection Name" required />
					<input
						className={baseField()}
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. The Artisan Collection"
					/>

					<div className="mt-4">
						<Label text="Main Drop Visual" required />
						<SingleImagePicker
							existingUrl={onlineMain}
							file={mainFile}
							onPick={(f) => setMainFile(f)}
							onClear={() => {
								setMainFile(null);
								setOnlineMain("");
							}}
						/>
						<Hint text="This is the face of your drop. It shows on the feed and preview cards." />
					</div>

					<div className="mt-4">
						<Label text="Description" />
						<textarea
							className={baseField()}
							rows={4}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Tell us the story behind this drop. We want to hear it."
						/>
					</div>

					<div className="mt-4">
						<Label text="Collection Tags" />
						<TagsInput
							value={tags}
							onChange={setTags}
							placeholder="streetwear, vintage, grunge..."
						/>
						<Hint text="Used in explore, search and trends" />
					</div>
				</Group>

				{/* Group: launch date / available now */}
				<Group>
					<Label text="Launch Date" />
					<DateTimePicker
						value={launchDate}
						onChange={setLaunchDate}
						disabled={availableNow}
					/>
					<div className="mt-2">
						<Toggle
							checked={availableNow}
							onChange={(v) => {
								setAvailableNow(v);
								if (v) setLaunchDate(new Date());
							}}
							label="Available Now"
						/>
					</div>
				</Group>

				{/* Group: gallery */}
				<Group>
					<Label text="Gallery Shots" />
					<MultiImagePicker
						existingUrls={onlineGallery}
						files={galleryFiles}
						onPick={setGalleryFiles}
						onClearExisting={() => setOnlineGallery([])}
						onRemoveExisting={(url) =>
							setOnlineGallery((prev) => prev.filter((u) => u !== url))
						}
					/>
				</Group>

				<div className="h-16" />
			</div>

			{/* sticky footer */}
			<div className="fixed inset-x-0 bottom-0 bg-bg/80 backdrop-blur border-t border-stroke px-4 sm:px-6 py-3">
				<div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
					<Button
						text={deleting ? "Deleting…" : "Delete Collection"}
						variant="outline"
						outlineColor="alert"
						onClick={onDelete}
						disabled={deleting}
					/>
					<Button
						text={saving ? "Saving…" : "Save Changes"}
						variant="primary"
						onClick={onSave}
						disabled={!canSave || saving}
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

/** -------------------------- small UI helpers -------------------------- */
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
function DateTimePicker({
	value,
	onChange,
	disabled,
}: {
	value: Date | null;
	onChange: (d: Date | null) => void;
	disabled?: boolean;
}) {
	const local = value
		? new Date(value.getTime() - value.getTimezoneOffset() * 60000)
				.toISOString()
				.slice(0, 16)
		: "";
	return (
		<input
			type="datetime-local"
			className={baseField()}
			value={local}
			onChange={(e) =>
				onChange(e.target.value ? new Date(e.target.value) : null)
			}
			disabled={disabled}
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
					<div className="mt-2">
						<button
							type="button"
							className={baseField() + " !py-1.5 !px-3 inline-block w-auto"}
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
	const total = (existingUrls?.length || 0) + (files?.length || 0);
	const slotsLeft = Math.max(0, MAX - total);
	const [msg, setMsg] = useState<string | null>(null);

	function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
		const picked = Array.from(e.target.files ?? []);
		if (!picked.length) return;
		if (slotsLeft <= 0) {
			setMsg(`You can only upload up to ${MAX} images.`);
			e.currentTarget.value = "";
			return;
		}
		const add = picked.slice(0, slotsLeft);
		onPick([...files, ...add]);
		if (picked.length > add.length) {
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
		<div>
			<label className="block">
				<div className="border border-dashed border-stroke/70 rounded-xl p-4 text-center cursor-pointer hover:bg-bg">
					<div className="text-sm text-text">
						Add extra angles, styling shots, or behind-the-scenes looks.
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
	maxTags = 10,
	transform = (s: string) => s, // e.g. (s) => s.toLowerCase()
}: {
	value: string[];
	onChange: (v: string[]) => void;
	placeholder?: string;
	maxTags?: number;
	transform?: (s: string) => string;
}) {
	const [draft, setDraft] = useState("");
	const [msg, setMsg] = useState<string | null>(null);

	function uniq(arr: string[]) {
		return Array.from(new Set(arr));
	}

	function tokenize(input: string) {
		return input
			.split(/[,\n]/g) // split by comma/new lines
			.map((t) => transform(t.trim()))
			.filter((t) => t.length > 0);
	}

	function addTokens(tokens: string[]) {
		if (!tokens.length) return;
		const next = uniq([...value, ...tokens]);
		if (next.length > maxTags) {
			const allowed = maxTags - value.length;
			const clipped = uniq([
				...value,
				...tokens.slice(0, Math.max(0, allowed)),
			]);
			onChange(clipped);
			setMsg(`Max ${maxTags} tags.`);
		} else {
			onChange(next);
			setMsg(null);
		}
	}

	function addFromDraft() {
		const toks = tokenize(draft);
		if (!toks.length) return;
		addTokens(toks);
		setDraft("");
	}

	function removeTag(t: string) {
		onChange(value.filter((x) => x !== t));
		setMsg(null);
	}

	return (
		<div>
			{/* chips */}
			{!!value.length && (
				<div className="flex flex-wrap gap-2 mb-2">
					{value.map((t) => (
						<span
							key={t}
							className="inline-flex items-center gap-2 rounded-full border border-stroke bg-surface px-3 py-1.5"
						>
							{t}
							<button
								type="button"
								className="text-text-muted hover:text-text"
								onClick={() => removeTag(t)}
								title="Remove"
							>
								×
							</button>
						</span>
					))}
				</div>
			)}

			{/* input + add */}
			<div className="flex gap-2">
				<input
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
							e.preventDefault();
							addFromDraft();
						} else if (e.key === "Backspace" && !draft && value.length) {
							// remove last chip when field is empty
							removeTag(value[value.length - 1]);
						}
					}}
					onPaste={(e) => {
						const text = e.clipboardData.getData("text");
						const toks = tokenize(text);
						if (toks.length > 1) {
							e.preventDefault();
							addTokens(toks);
						}
					}}
					placeholder={placeholder ?? "Add a tag and press Enter"}
					className={baseField() + " px-4 py-3"}
				/>
				<button
					type="button"
					onClick={addFromDraft}
					className="rounded-xl bg-accent text-bg px-4 py-3 font-semibold"
				>
					Add
				</button>
			</div>

			{msg && <div className="text-xs text-alert mt-2">{msg}</div>}
			<div className="text-xs text-text-muted mt-1">
				{value.length}/{maxTags} tags
			</div>
		</div>
	);
}
