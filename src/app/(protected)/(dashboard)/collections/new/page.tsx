/* /app/brand/collection/new/page.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { uploadFileGetURL } from "@/lib/storage/upload";
import { uploadImageCloudinary } from "@/lib/storage/cloudinary";
import { fetchBrandById } from "@/lib/firebase/queries/brandspace";
import { sendNotificationCF } from "@/lib/firebase/callables/users";
import { addCollectionCF } from "@/lib/firebase/queries/collection";

/* ------------------------------ helpers ------------------------------ */
function baseField() {
	return "w-full rounded-xl border border-stroke bg-surface px-3 py-2 outline-none focus:border-accent";
}
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
	max = 4,
}: {
	files: File[];
	onPick: (next: File[]) => void;
	max?: number;
}) {
	const total = files.length;
	const slotsLeft = Math.max(0, max - total);
	const [msg, setMsg] = useState<string | null>(null);

	function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
		const picked = Array.from(e.target.files ?? []);
		if (!picked.length) return;
		const take = picked.slice(0, slotsLeft);
		onPick([...files, ...take]);
		if (picked.length > take.length)
			setMsg(
				`Only ${slotsLeft} more image${
					slotsLeft === 1 ? "" : "s"
				} allowed (max ${max}).`
			);
		else setMsg(null);
		e.currentTarget.value = "";
	}

	return (
		<div>
			<label className="block">
				<div className="border border-dashed border-stroke/70 rounded-xl p-4 text-center cursor-pointer hover:bg-bg">
					<div className="text-sm text-text">
						Add extra angles, styling shots, or behind-the-scenes looks.
					</div>
					<div className="text-xs text-text-muted mt-1">
						{total} / {max} selected
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
			{msg && <div className="text-xs text-alert mt-2">{msg}</div>}
		</div>
	);
}
function TagsInput({
	value,
	onChange,
	placeholder,
	maxTags = 10,
	transform = (s: string) => s,
}: {
	value: string[];
	onChange: (v: string[]) => void;
	placeholder?: string;
	maxTags?: number;
	transform?: (s: string) => string;
}) {
	const [draft, setDraft] = useState("");
	const [msg, setMsg] = useState<string | null>(null);

	const uniq = (arr: string[]) => Array.from(new Set(arr));
	const tokenize = (input: string) =>
		input
			.split(/[,\n]/g)
			.map((t) => transform(t.trim()))
			.filter((t) => t.length > 0);

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
			<div className="flex gap-2">
				<input
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
							e.preventDefault();
							addFromDraft();
						} else if (e.key === "Backspace" && !draft && value.length) {
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

/* ---------------------------------- page --------------------------------- */
export default function NewCollectionPage() {
	const router = useRouter();
	const auth = getAuth();

	const [bootLoading, setBootLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	// fields
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [availableNow, setAvailableNow] = useState(false);
	const [launchDate, setLaunchDate] = useState<Date | null>(null);

	const [mainFile, setMainFile] = useState<File | null>(null);
	const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

	const [brandSnap, setBrandSnap] = useState<any>(null);
	const [brandName, setBrandName] = useState<string>("");

	const canSave = !!name.trim() && !!mainFile;

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const uid = auth.currentUser?.uid;
				if (!uid) {
					router.push("/");
					return;
				}
				const brand = await fetchBrandById(uid);
				if (!mounted) return;
				setBrandSnap(serializeBrandSnapshot(brand));
				setBrandName(brand?.brandName ?? "");
			} catch (e: any) {
				if (!mounted) return;
				setErr(e?.message ?? "Failed to load brand context.");
			} finally {
				if (mounted) setBootLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [auth.currentUser, router]);

	async function onCreate() {
		if (!canSave) return;
		setSaving(true);
		setErr(null);
		try {
			const uid = auth.currentUser?.uid;
			if (!uid) {
				router.push("/");
				return;
			}
			// upload main
			let mainImageUrl: string;
			try {
				// Primary: Upload to Cloudinary
				mainImageUrl = await uploadImageCloudinary(mainFile!, {
					folder: `dropImages/${uid}`,
					tags: ["collection", "main", uid],
				});
				console.log("✅ Main image uploaded to Cloudinary:", mainImageUrl);
			} catch (cloudinaryError) {
				// Fallback: Upload to Firebase Storage
				console.warn(
					"⚠️ Cloudinary upload failed, falling back to Firebase Storage:",
					cloudinaryError
				);
				mainImageUrl = await uploadFileGetURL(
					mainFile!,
					`dropImages/${uid}/${Date.now()}-${mainFile!.name}`
				);
				console.log(
					"✅ Main image uploaded to Firebase Storage:",
					mainImageUrl
				);
			}

			// upload gallery (cap 4)
			let galleryImageUrls: string[] | undefined;
			if (galleryFiles.length) {
				const take = galleryFiles.slice(0, 4);
				galleryImageUrls = [];

				for (const f of take) {
					try {
						// Primary: Upload to Cloudinary
						const url = await uploadImageCloudinary(f, {
							folder: `dropImages/${uid}`,
							tags: ["collection", "gallery", uid],
						});
						galleryImageUrls.push(url);
						console.log("✅ Gallery image uploaded to Cloudinary:", url);
					} catch (cloudinaryError) {
						// Fallback: Upload to Firebase Storage
						console.warn(
							"⚠️ Cloudinary upload failed for gallery image, falling back to Firebase Storage:",
							cloudinaryError
						);
						const url = await uploadFileGetURL(
							f,
							`dropImages/${uid}/${Date.now()}-${f.name}`
						);
						galleryImageUrls.push(url);
						console.log("✅ Gallery image uploaded to Firebase Storage:", url);
					}
				}
			}

			const payload: Record<string, any> = {
				brandId: uid,
				name: name.trim(),
				mainImageUrl,
				description: description.trim() || null,
				styleTags: tags.length ? tags : null,
				galleryImageUrls: galleryImageUrls ?? null,
				createdBy: uid,
				isDeleted: false,
				heatScore: 0,
				launchDate:
					(availableNow ? new Date() : launchDate || null)?.toISOString?.() ??
					null,
				isPublished: availableNow,
				// ⭐ denormalized brand snapshot
				brand: brandSnap ?? undefined,
			};
			Object.keys(payload).forEach(
				(k) => payload[k] == null && delete payload[k]
			);

			const { id } = await addCollectionCF(payload);

			// optional: follower notification (parity with Flutter)
			try {
				await sendNotificationCF({
					title: `🔥 New drop from ${brandName} just landed`,
					content: "Don’t sleep on it. Check out the collection now",
					externalUserIds: [uid], // your backend can fan this out to followers
				});
			} catch {
				/* non-fatal */
			}

			router.push(id ? `/brand/collections/${id}` : "/brand-space");
		} catch (e: any) {
			setErr(e?.message ?? "Failed to create collection.");
		} finally {
			setSaving(false);
		}
	}

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
				<h1 className="font-heading font-semibold text-2xl">
					Set Up Your Drop Collection
				</h1>
				<p className="text-text-muted mt-1">
					No rules here... Just drop your style.
				</p>
			</div>

			<div className="px-4 sm:px-6 mt-6 space-y-4">
				{/* name / main visual / description / tags */}
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
						<SingleImagePicker file={mainFile} onPick={setMainFile} />
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

				{/* launch date / available now */}
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
								setLaunchDate(v ? new Date() : null);
							}}
							label="Available Now"
						/>
					</div>
				</Group>

				{/* gallery */}
				<Group>
					<Label text="Gallery Shots" />
					<MultiImagePicker files={galleryFiles} onPick={setGalleryFiles} />
				</Group>

				<div className="h-16" />
			</div>

			{/* sticky footer */}
			<div className="fixed inset-x-0 bottom-0 bg-bg/80 backdrop-blur border-t border-stroke px-4 sm:px-6 py-3">
				<div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
					<Button
						text={saving ? "Saving…" : "Save Collection"}
						variant="primary"
						onClick={onCreate}
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
