/* eslint-disable @next/next/no-img-element */
/* /app/brand/collections/page.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
	deleteCollection,
	getCollectionListForBrand,
} from "@/lib/firebase/queries/collection";
// (add this if you don't have it yet)
// export async function deleteCollection(id: string, brandId?: string): Promise<void> { ... }
import DropStatusCapsule from "../DropStatusCapsule";

/** -------------------- types (align to your CollectionModel) -------------------- */
type CollectionLite = {
	id: string;
	brandId: string;
	name: string;
	description?: string | null;
	mainImageUrl: string;
	galleryImageUrls?: string[];
	launchDate?: any | null; // Timestamp | string | Date
	isPublished?: boolean;
	heatScore?: number;
};

/** ------------------------------- utils -------------------------------- */
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

function normalizeImageUrl(x: any): string | null {
	if (!x) return null;
	// already a URL string?
	if (typeof x === "string") return /^https?:\/\//i.test(x) ? x : null;
	// common object shapes
	if (typeof x === "object") {
		const cand = x.url ?? x.imageUrl ?? x.src ?? x.downloadURL ?? null;
		return typeof cand === "string" && /^https?:\/\//i.test(cand) ? cand : null;
	}
	return null;
}

function normalizeCollectionShape(raw: any): CollectionLite {
	// main image could be under many keys across older writes
	const mainImageUrl =
		normalizeImageUrl(
			raw.mainImageUrl ??
				raw.mainImageURL ??
				raw.mainImage ??
				raw.mainVisualUrl ??
				raw.coverUrl ??
				raw.coverImageUrl ??
				(raw.mainImage && (raw.mainImage.url ?? raw.mainImage.src))
		) ?? "";

	// gallery could be under galleryImageUrls / galleryImages / images / gallery
	const gallerySource =
		raw.galleryImageUrls ??
		raw.galleryImages ??
		raw.images ??
		raw.gallery ??
		[];

	const galleryImageUrls = Array.isArray(gallerySource)
		? (gallerySource.map(normalizeImageUrl).filter(Boolean) as string[])
		: [];

	return {
		id: raw.id,
		brandId: raw.brandId,
		name: raw.name,
		description: raw.description ?? null,
		mainImageUrl,
		galleryImageUrls,
		launchDate: raw.launchDate ?? null,
		isPublished: !!raw.isPublished,
		heatScore: typeof raw.heatScore === "number" ? raw.heatScore : 0,
	};
}

function seededRand(seed: string) {
	// simple deterministic PRNG (mulberry32-ish)
	let h =
		1779033703 ^ seed.split("").reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0);
	return () => {
		h = Math.imul(h ^ (h >>> 16), 2246822507);
		h = Math.imul(h ^ (h >>> 13), 3266489909);
		const t = (h ^= h >>> 16) >>> 0;
		return t / 2 ** 32;
	};
}

// function StatusPill({ when, live }: { when: Date | null; live?: boolean }) {
// 	const now = new Date();
// 	const text = live
// 		? "Live"
// 		: when && when > now
// 		? "Upcoming"
// 		: when
// 		? "Released"
// 		: null;
// 	if (!text) return null;
// 	return (
// 		<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-bg/90 border border-stroke backdrop-blur">
// 			{text}
// 		</span>
// 	);
// }

function ExpandableText({
	text,
	maxChars = 160,
}: {
	text: string;
	maxChars?: number;
}) {
	const [open, setOpen] = useState(false);
	if (text.length <= maxChars) return <p className="text-text-muted">{text}</p>;
	return (
		<div className="text-text-muted">
			<span>{open ? text : text.slice(0, maxChars) + "..."}</span>{" "}
			<button
				className="underline underline-offset-2"
				onClick={() => setOpen((s) => !s)}
			>
				{open ? "Show less" : "Read more"}
			</button>
		</div>
	);
}

/** ------------------------------ page ---------------------------------- */
export default function CollectionsTab() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const [collections, setCollections] = useState<CollectionLite[]>([]);
	const [isBrandView, setIsBrandView] = useState(true); // brand tab by default

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const auth = getAuth();
				const uid = auth.currentUser?.uid;
				if (!uid) {
					router.push("/"); // force sign-in
					return;
				}
				const list = await getCollectionListForBrand(uid);
				console.log(list[0]);
				if (!mounted) return;
				// normalize dates
				const normalized = (list as any[]).map((raw) => {
					const n = normalizeCollectionShape(raw);
					return { ...n, launchDate: asDate(n.launchDate) };
				});
				setCollections(normalized);

				setIsBrandView(true);
			} catch (e: any) {
				if (!mounted) return;
				setErr(e?.message ?? "Failed to load collections");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [router]);

	async function onDelete(id: string, brandId: string) {
		if (!confirm("Delete this collection? This cannot be undone.")) return;
		setDeletingId(id);
		try {
			await deleteCollection(id, brandId);
			setCollections((prev) => prev.filter((c) => c.id !== id));
		} catch (e: any) {
			setErr(e?.message ?? "Failed to delete collection");
		} finally {
			setDeletingId(null);
		}
	}

	if (loading) {
		return (
			<div className="px-4 sm:px-6 py-6 space-y-4">
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className="rounded-2xl border border-stroke bg-surface p-2"
					>
						{/* skeleton grid */}
						<div className="grid grid-cols-3 gap-2">
							<div className="col-span-2 row-span-2 h-40 rounded-xl bg-stroke/30 animate-pulse" />
							<div className="h-20 rounded-xl bg-stroke/30 animate-pulse" />
							<div className="col-span-1 row-span-2 h-40 rounded-xl bg-stroke/30 animate-pulse" />
							<div className="col-span-2 h-20 rounded-xl bg-stroke/30 animate-pulse" />
						</div>
						<div className="h-4 mt-3 w-40 rounded bg-stroke/30 animate-pulse" />
					</div>
				))}
			</div>
		);
	}

	if (!collections.length) {
		return (
			<div className="min-h-dvh grid place-items-center px-4">
				<div className="text-center">
					<img
						src="/empty-illustrations/collection.png"
						alt=""
						className="mx-auto mb-4 h-28 opacity-80"
					/>
					<p className="text-text-muted">
						{isBrandView
							? "Create your first collection and bring all your drops together."
							: "No collections here yet. This brand hasn’t set any up."}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-6 py-6">
			{err && (
				<div className="mb-6 rounded-xl border border-alert/30 bg-alert/10 px-4 py-2 text-alert">
					{err}
				</div>
			)}
			<div className="flex justify-end mb-8">
				<Button
					text="Drop a Collection"
					variant="calmAccent2"
					onClick={() => router.push("/collections/new")}
				/>
			</div>
			{/* 👇 responsive grid: 1 col (mobile), 2 cols (md), 3 cols (xl) */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
				{collections.map((c) => (
					<div key={c.id} className="min-w-0">
						<CollectionCard
							c={c}
							isBrand={isBrandView}
							onEdit={() => router.push(`/brand-space/collection/${c.id}/edit`)}
							onDelete={() => onDelete(c.id, c.brandId)}
							onOpen={() => router.push(`/brand-space/collection/${c.id}`)}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

/** --------------------------- card component ---------------------------- */
function CollectionCard({
	c,
	isBrand,
	onOpen,
	onEdit,
	onDelete,
}: {
	c: CollectionLite;
	isBrand: boolean;
	onOpen: () => void;
	onEdit: () => void;
	onDelete: () => void;
}) {
	// --- normalize anything that isn't a plain URL string ---
	function pickUrl(x: any): string | null {
		if (!x) return null;
		if (typeof x === "string") return /^https?:\/\//i.test(x) ? x : null;
		// common shapes from older data
		if (typeof x === "object") {
			const cand = x.url ?? x.imageUrl ?? x.src ?? null;
			return typeof cand === "string" && /^https?:\/\//i.test(cand)
				? cand
				: null;
		}
		return null;
	}

	// inside CollectionCard
	const imgs = useMemo(() => {
		function pickUrl(x: any): string | null {
			if (!x) return null;
			if (typeof x === "string") return /^https?:\/\//i.test(x) ? x : null;
			if (typeof x === "object") {
				const cand = x.url ?? x.imageUrl ?? x.src ?? null;
				return typeof cand === "string" && /^https?:\/\//i.test(cand)
					? cand
					: null;
			}
			return null;
		}

		const main = pickUrl(c.mainImageUrl);
		const gallery = (c.galleryImageUrls ?? [])
			.map(pickUrl)
			.filter((u): u is string => !!u);

		// 👉 only keep 3: [main, g1, g2]
		return [main, ...gallery].filter(Boolean).slice(0, 3);
	}, [c.mainImageUrl, c.galleryImageUrls]);

	const max = Math.min(imgs.length, 10);
	const rnd = seededRand(c.id);
	const largeIndices = useMemo(() => {
		const picks = new Set<number>();
		if (max > 2) {
			const first = 1 + Math.floor(rnd() * (max - 1));
			picks.add(first);
			if (max > 3 && rnd() > 0.5) {
				let second = 1 + Math.floor(rnd() * (max - 1));
				while (second === first) second = 1 + Math.floor(rnd() * (max - 1));
				picks.add(second);
			}
		}
		return picks;
	}, [max, rnd]);

	const when = asDate(c.launchDate);
	const live = c.isPublished || (!!when && when <= new Date());

	return (
		<div className="space-y-2">
			<div className="relative rounded-2xl border border-stroke bg-surface p-2">
				<button
					type="button"
					onClick={onOpen}
					className="block w-full text-left"
				>
					<div
						className="grid gap-2"
						style={{
							gridTemplateColumns: "repeat(3, minmax(0,1fr))",
							gridAutoRows: "90px",
						}}
					>
						{/* main (2x2) */}
						{imgs[0] ? (
							<div className="col-span-2 row-span-2 overflow-hidden rounded-xl border border-stroke">
								<img
									src={imgs[0]}
									alt=""
									loading="lazy"
									draggable={false}
									className="h-full w-full object-cover"
								/>
							</div>
						) : (
							<div className="col-span-2 row-span-2 rounded-xl bg-stroke/30" />
						)}

						{/* the other two (1x1 each) */}
						{imgs.slice(1).map((src, i) => (
							<div
								key={i}
								className="overflow-hidden rounded-xl border border-stroke"
							>
								<img
									src={src}
									alt=""
									loading="lazy"
									draggable={false}
									className="h-full w-full object-cover"
								/>
							</div>
						))}
					</div>
				</button>

				<div className="absolute left-3 top-3">
					<DropStatusCapsule launchDate={when} />
				</div>
			</div>

			<div className="px-1">
				<h3 className="font-heading text-lg font-semibold">
					{c.name?.toUpperCase?.() || c.name}
				</h3>
			</div>

			{!!c.description && (
				<div className="px-1">
					<div className="rounded-2xl border border-stroke bg-surface p-4">
						<ExpandableText text={c.description} />
					</div>
				</div>
			)}

			{isBrand && (
				<div className="flex items-center justify-end gap-2 px-1">
					<Button text="Edit" variant="outline" onClick={onEdit} />
					<Button
						text="Delete"
						variant="outline"
						outlineColor="alert"
						onClick={onDelete}
					/>
				</div>
			)}

			<hr className="border-stroke mt-2" />
		</div>
	);
}
