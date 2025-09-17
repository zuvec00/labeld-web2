/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	fetchDropContentById,
	deleteDropContent as deleteDropContentAPI,
	type DropContent,
} from "@/lib/firebase/queries/dropContent";
import {
	getProductListForBrand,
	ProductLite,
} from "@/lib/firebase/queries/product";
import { uploadContentImageWeb } from "@/lib/storage/upload";
import { updateDropContentCF } from "@/lib/firebase/callables/dropContent";

export default function EditDropContentPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();
	const auth = getAuth();

	// loading & form state
	const [initialLoading, setInitialLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	// data
	const [content, setContent] = useState<DropContent | null>(null);
	const [products, setProducts] = useState<ProductLite[]>([]);

	// form fields
	const [selectedProductId, setSelectedProductId] = useState<string>("");
	const [teaserFile, setTeaserFile] = useState<File | null>(null);
	const [teaserPreview, setTeaserPreview] = useState<string | null>(null);
	const [momentName, setMomentName] = useState("");
	const [momentDescription, setMomentDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");

	const canSave = useMemo(() => !!selectedProductId, [selectedProductId]);

	// bootstrap
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const user = auth.currentUser;
				if (!user) {
					router.push("/"); // force sign-in
					return;
				}
				const c = await fetchDropContentById(id);
				if (!mounted) return;
				if (!c) {
					setErr("Drop content not found.");
					setInitialLoading(false);
					return;
				}
				setContent(c);
				setSelectedProductId(c.dropProductId ?? "");
				setMomentName(c.momentName ?? "");
				setMomentDescription(c.momentDescription ?? "");
				setTags(Array.isArray(c.tags) ? c.tags : []);
				setTeaserPreview(c.teaserImageUrl);

				const list = await getProductListForBrand(c.brandId);
				if (!mounted) return;
				setProducts(list);
			} catch (e: any) {
				if (!mounted) return;
				setErr(e?.message ?? "Failed to load.");
			} finally {
				if (mounted) setInitialLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [auth.currentUser, id, router]);

	// tag helpers
	const addTag = () => {
		const t = tagInput.trim();
		if (!t) return;
		if (tags.includes(t)) return;
		setTags((prev) => [...prev, t]);
		setTagInput("");
	};
	const removeTag = (t: string) =>
		setTags((prev) => prev.filter((x) => x !== t));

	// file preview
	const onPickTeaser: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		const f = e.target.files?.[0];
		if (!f) return;
		setTeaserFile(f);
		setTeaserPreview(URL.createObjectURL(f));
	};

	async function onSave() {
		if (!content) return;
		const user = auth.currentUser;
		if (!user) return;

		setSaving(true);
		setErr(null);
		try {
			// upload if changed
			let teaserImageUrl = content.teaserImageUrl;
			if (teaserFile) {
				teaserImageUrl = await uploadContentImageWeb(teaserFile, user.uid);
			}

			// find selected product launch date to match Flutter save
			const selected = products.find((p) => p.id === selectedProductId);
			const updatedData: Record<string, any> = {
				brandId: content.brandId,
				userId: user.uid,
				dropId: null, // optional; set if you have one
				dropProductId: selectedProductId,
				launchDate: selected?.launchDate?.toISOString?.() ?? null,
				teaserImageUrl,
				momentName: momentName || null,
				momentDescription: momentDescription || null,
				tags: tags.length ? tags : null,
			};
			// remove nulls to keep writes clean
			Object.keys(updatedData).forEach(
				(k) => updatedData[k] == null && delete updatedData[k]
			);

			await updateDropContentCF({ contentId: content.id, updatedData });
			router.back(); // or router.push("/brandspace")
		} catch (e: any) {
			setErr(e?.message ?? "Failed to save.");
		} finally {
			setSaving(false);
		}
	}

	async function onDelete() {
		if (!content) return;
		if (!confirm("Delete this drop content? This cannot be undone.")) return;
		setDeleting(true);
		setErr(null);
		try {
			await deleteDropContentAPI(content.id, content.brandId);
			router.push("/brand-space");
		} catch (e: any) {
			setErr(e?.message ?? "Failed to delete.");
		} finally {
			setDeleting(false);
		}
	}

	if (initialLoading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!content) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<p className="text-text-muted">{err ?? "Not found."}</p>
			</div>
		);
	}

	return (
		<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-3xl mx-auto">
			<h1 className="font-heading font-semibold text-2xl">Edit Drop Content</h1>
			<p className="text-text-muted mt-1">
				Update your drop content details below.
			</p>

			{err && <p className="mt-4 text-alert">{err}</p>}

			{/* Group: Link to a Piece */}
			<div className="mt-6 rounded-2xl bg-surface border border-stroke p-6">
				<label className="block text-sm text-text-muted mb-2">
					Link This to a Piece <span className="text-cta">*</span>
				</label>
				<select
					className="w-full rounded-xl border border-stroke px-4 py-3 bg-bg text-text outline-none focus:border-accent"
					value={selectedProductId}
					onChange={(e) => setSelectedProductId(e.target.value)}
				>
					<option value="" disabled>
						{products.length ? "Tap to select" : "No pieces found"}
					</option>
					{products.map((p) => (
						<option key={p.id} value={p.id}>
							{p.dropName}
						</option>
					))}
				</select>
			</div>

			{/* Group: Teaser image */}
			<div className="mt-4 rounded-2xl bg-surface border border-stroke p-6">
				<label className="block text-sm text-text-muted mb-2">
					Upload Your Teaser <span className="text-cta">*</span>
				</label>

				{teaserPreview && (
					<img
						src={teaserPreview}
						alt="Teaser preview"
						className="w-full max-h-[60vh] object-cover rounded-xl border border-stroke mb-3"
					/>
				)}

				<input
					type="file"
					accept="image/*"
					onChange={onPickTeaser}
					className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border file:border-stroke file:bg-bg file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-surface"
				/>
				<p className="text-xs text-text-muted mt-2">
					Upload a teaser image that sets a mood for your piece. Make it count.
				</p>
			</div>

			{/* Group: Text fields */}
			<div className="mt-4 rounded-2xl bg-surface border border-stroke p-6">
				<label className="block text-sm text-text-muted mb-2">
					Name this Moment
				</label>
				<input
					value={momentName}
					onChange={(e) => setMomentName(e.target.value)}
					placeholder="e.g. limited edition, Studio Sesh..."
					className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
				/>

				<label className="block text-sm text-text-muted mb-2 mt-4">
					Describe this Moment
				</label>
				<textarea
					value={momentDescription}
					onChange={(e) => setMomentDescription(e.target.value)}
					placeholder="1–2 lines that tell the story or hype it up"
					className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent min-h-[110px]"
				/>

				<label className="block text-sm text-text-muted mb-2 mt-4">
					Moment Tags
				</label>
				<div className="flex gap-2">
					<input
						value={tagInput}
						onChange={(e) => setTagInput(e.target.value)}
						onKeyDown={(e) =>
							e.key === "Enter" && (e.preventDefault(), addTag())
						}
						placeholder="Add a tag and press Enter"
						className="flex-1 rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
					/>
					<button
						type="button"
						onClick={addTag}
						className="rounded-xl bg-accent text-bg px-4 py-3 font-semibold"
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
									className="text-text-muted hover:text-text"
								>
									×
								</button>
							</span>
						))}
					</div>
				)}

				<p className="text-xs text-text-muted mt-3">
					Helps users discover your content in the feed.
				</p>
			</div>

			{/* Actions */}
			<div className="mt-6 flex items-center justify-between">
				<Button
					text={saving ? "Saving…" : "Save Changes"}
					variant={canSave ? "cta" : "disabled"}
					disabled={!canSave || saving}
					onClick={onSave}
				/>
				<Button
					text={deleting ? "Deleting…" : "Delete Content"}
					variant="outline"
					outlineColor="alert"
					onClick={onDelete}
					disabled={deleting}
				/>
			</div>
		</div>
	);
}
