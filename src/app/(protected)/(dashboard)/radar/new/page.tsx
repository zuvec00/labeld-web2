/* /app/brand-space/drop-content/new/page.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	getProductListForBrand,
	type ProductLite,
} from "@/lib/firebase/queries/product";
import { uploadContentImageWeb } from "@/lib/storage/upload";
import { addDropContentCF } from "@/lib/firebase/callables/dropContent"; // <-- new
import { sendNotificationCF } from "@/lib/firebase/callables/users"; // optional generic notification
import { fetchBrandById } from "@/lib/firebase/queries/brandspace";

export default function NewDropContentPage() {
	const router = useRouter();
	const auth = getAuth();

	// bootstrap
	const [initialLoading, setInitialLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);

	// products
	const [products, setProducts] = useState<ProductLite[]>([]);

	// form fields
	const [selectedProductId, setSelectedProductId] = useState<string>("");
	const [teaserFile, setTeaserFile] = useState<File | null>(null);
	const [teaserPreview, setTeaserPreview] = useState<string | null>(null);
	const [momentName, setMomentName] = useState("");
	const [momentDescription, setMomentDescription] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");

	const [saving, setSaving] = useState(false);

	const canSave = useMemo(
		() => !!selectedProductId && !!teaserFile,
		[selectedProductId, teaserFile]
	);

	function serializeBrandForContent(b: any) {
		if (!b) return null;
		const maybeISO = (v: any) =>
			v instanceof Date
				? v.toISOString()
				: typeof v?.toDate === "function"
				? v.toDate().toISOString()
				: typeof v === "string"
				? v
				: null;

		const out = {
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
			createdAt: maybeISO(b.createdAt),
			updatedAt: maybeISO(b.updatedAt),
		};
		Object.keys(out).forEach(
			(k) => (out as any)[k] == null && delete (out as any)[k]
		);
		return out;
	}

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const user = auth.currentUser;
				if (!user) {
					router.push("/"); // sign-in
					return;
				}
				const list = await getProductListForBrand(user.uid);
				if (!mounted) return;
				setProducts(list);
				setErr(null);
			} catch (e: any) {
				if (!mounted) return;
				setErr(e?.message ?? "Failed to load products.");
			} finally {
				if (mounted) setInitialLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [router, auth.currentUser]);

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

	async function onCreate() {
		const user = auth.currentUser;
		if (!user || !teaserFile) return;

		setSaving(true);
		setErr(null);
		try {
			// 1) upload image
			const teaserImageUrl = await uploadContentImageWeb(teaserFile, user.uid);

			// 2) resolve selected product + launch date (mirrors Flutter)
			const selected = products.find((p) => p.id === selectedProductId);
			const launchDateISO =
				(selected as any)?.launchDate instanceof Date
					? (selected as any).launchDate.toISOString()
					: typeof (selected as any)?.launchDate === "string"
					? new Date((selected as any).launchDate).toISOString()
					: null;

			// 3) FETCH BRAND + serialize (this is the denormalized blob 👇)
			const brand = await fetchBrandById(user.uid);
			const brandMap = serializeBrandForContent(brand);

			// 3) construct content payload
			const contentData: Record<string, any> = {
				brandId: user.uid, // brand == current user
				userId: user.uid,
				dropId: (selected as any)?.dropId ?? null,
				dropProductId: selectedProductId,
				launchDate: launchDateISO,
				teaserImageUrl,
				momentName: momentName || null,
				momentDescription: momentDescription || null,
				tags: tags.length ? tags : null,
				isDeleted: false,
				isPublished: false,
				visibility: "public",
				heatScore: 0,
				mediaType: "image",
				contentLinkUrl: null,
				reactions: { "🔥": 0, "🥶": 0, "😮‍💨": 0, "🫶": 0 },
				// ⭐ DENORMALIZED BRAND SNAPSHOT (parity with Flutter‘s brand.toMap())
				brand: brandMap,
			};
			Object.keys(contentData).forEach(
				(k) => contentData[k] == null && delete contentData[k]
			);

			// 4) create via CF
			const newId = await addDropContentCF(contentData);

			// 5) (optional) send a notification
			// await sendNotificationCF({
			//   title: "New drop content",
			//   content: momentName || "A new moment just dropped 👀",
			//   externalUserIds: [user.uid], // or your target audience
			// });

			// 6) go back to Radar
			router.push("/radar");
		} catch (e: any) {
			setErr(e?.message ?? "Failed to create content.");
		} finally {
			setSaving(false);
		}
	}

	if (initialLoading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-3xl mx-auto">
			<h1 className="font-heading font-semibold text-2xl">Hype Your Drop 😮‍💨</h1>
			<p className="text-text-muted mt-1">
				Build anticipation by giving your audience a sneak peek of what’s
				coming.
			</p>

			{err && <p className="mt-4 text-alert">{err}</p>}

			{/* Link to a Piece */}
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
							{(p as any).dropName ?? "Untitled Piece"}
						</option>
					))}
				</select>
			</div>

			{/* Teaser Image */}
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

			{/* Text fields */}
			<div className="mt-4 rounded-2xl bg-surface border border-stroke p-6">
				<label className="block text-sm text-text-muted mb-2">
					Title this Moment
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
					text={saving ? "Dropping…" : "Drop the Moment"}
					variant={canSave ? "primary" : "disabled"}
					disabled={!canSave || saving}
					onClick={onCreate}
				/>
				<Button
					text="Cancel"
					variant="outline"
					outlineColor="text-text-muted"
					onClick={() => router.back()}
				/>
			</div>
		</div>
	);
}
