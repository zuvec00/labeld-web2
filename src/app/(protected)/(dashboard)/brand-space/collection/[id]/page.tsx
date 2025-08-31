/* eslint-disable @next/next/no-img-element */
/* /app/brand-space/collection/[id]/page.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import Button from "@/components/ui/button";
import { getAuth } from "firebase/auth";
import {
	fetchCollectionById,
	type CollectionDoc,
} from "@/lib/firebase/queries/collection";
import {
	getProductListForBrand,
	Product,
	type ProductLite,
} from "@/lib/firebase/queries/product";
import DropStatusCapsule from "@/components/brand/brandspace/DropStatusCapsule";
import { formatWithCommasDouble, getCurrencyFromMap } from "@/lib/format";

/* ------------------------------- utils -------------------------------- */
function asDate(v: any): Date | null {
	if (!v) return null;
	if (v instanceof Date) return v;
	if (typeof v?.toDate === "function") return v.toDate();
	if (typeof v === "number") return new Date(v);
	if (typeof v === "string") {
		const d = new Date(v);
		return isNaN(+d) ? null : d;
	}
	return null;
}

function normalizeImageUrl(x: any): string | null {
	if (!x) return null;
	if (typeof x === "string") return /^https?:\/\//i.test(x) ? x : null;
	if (typeof x === "object") {
		const cand = x.url ?? x.src ?? x.imageUrl ?? x.downloadURL ?? null;
		return typeof cand === "string" && /^https?:\/\//i.test(cand) ? cand : null;
	}
	return null;
}

/* ---------------------------- small widgets --------------------------- */
function ExpandableText({
	text,
	maxChars = 200,
}: {
	text: string;
	maxChars?: number;
}) {
	const [open, setOpen] = useState(false);
	if (!text) return null;
	if (text.length <= maxChars) return <p className="text-white/95">{text}</p>;
	return (
		<p className="text-white/95">
			{open ? text : text.slice(0, maxChars) + "…"}{" "}
			<button
				className="underline underline-offset-2"
				onClick={() => setOpen((s) => !s)}
			>
				{open ? "Show less" : "Read more"}
			</button>
		</p>
	);
}

function CountdownTimer({ target }: { target: Date }) {
	const [, setTick] = useState(0);
	useEffect(() => {
		const t = setInterval(() => setTick((n) => n + 1), 1000);
		return () => clearInterval(t);
	}, []);
	const diff = +target - +new Date();
	if (diff <= 0) return null;
	const s = Math.floor(diff / 1000);
	const days = Math.floor(s / 86400);
	const hours = Math.floor((s % 86400) / 3600);
	const mins = Math.floor((s % 3600) / 60);
	const secs = s % 60;
	return (
		<div className="rounded-full border border-stroke bg-surface px-3 py-1 text-sm">
			{days}d {hours}h {mins}m {secs}s
		</div>
	);
}

/* very light carousel: scroll-snap + arrows */
function ImageCarousel({
	images,
	height = "60vh",
}: {
	images: string[];
	height?: string;
}) {
	const [idx, setIdx] = useState(0);
	const safe = images.filter(Boolean);
	const go = (n: number) =>
		setIdx((i) => (safe.length ? (i + n + safe.length) % safe.length : 0));

	return (
		<div className="relative">
			<div
				className="flex snap-x snap-mandatory overflow-x-auto rounded-b-2xl"
				style={{ height }}
			>
				{safe.map((src, i) => (
					<div
						key={src + i}
						className="relative w-full flex-shrink-0 snap-center"
						style={{ height, minWidth: "100%" }}
					>
						<img
							src={src}
							alt=""
							className="h-full w-full object-cover"
							draggable={false}
						/>
					</div>
				))}
			</div>

			{/* arrows */}
			{safe.length > 1 && (
				<>
					<button
						onClick={() => go(-1)}
						className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm"
						aria-label="Prev"
					>
						‹
					</button>
					<button
						onClick={() => go(+1)}
						className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm"
						aria-label="Next"
					>
						›
					</button>
				</>
			)}
		</div>
	);
}

/* ------------------------------ page ---------------------------------- */
export default function CollectionDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);

	const [collection, setCollection] = useState<CollectionDoc | null>(null);
	const [pieces, setPieces] = useState<Product[]>([]);

	const images = useMemo(() => {
		if (!collection) return [];
		const main = normalizeImageUrl(collection.mainImageUrl);
		const gallery = (collection.galleryImageUrls ?? [])
			.map(normalizeImageUrl)
			.filter((u): u is string => !!u);
		return [main, ...gallery].filter(Boolean) as string[];
	}, [collection]);

	const when = asDate(collection?.launchDate);
	const showCountdown = !!when && when > new Date();

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const doc = await fetchCollectionById(id);
				if (!mounted) return;
				if (!doc) {
					setErr("Collection not found.");
					setLoading(false);
					return;
				}
				setCollection(doc);

				// fetch pieces belonging to this collection
				const list = await getProductListForBrand(doc.brandId);
				if (!mounted) return;
				const filtered = (list as Product[]).filter(
					(p) => (p as any).dropId === doc.id // align with your Product schema
				);
				setPieces(filtered);
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

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!collection) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<div className="text-center">
					<p className="text-text-muted mb-3">{err ?? "Not found."}</p>
					<Button text="Back" onClick={() => router.back()} />
				</div>
			</div>
		);
	}

	return (
		<div className="relative">
			{/* HERO with gradient + overlay content */}
			<div className="relative">
				<ImageCarousel images={images} height="60vh" />

				{/* bottom gradient overlay (lower half) */}
				<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 rounded-b-2xl bg-gradient-to-b from-transparent to-black/70" />

				{/* status pill (top-right, safe-area-ish spacing) */}
				<div className="absolute right-4 top-4">
					<DropStatusCapsule launchDate={when} />
				</div>

				{/* text overlay (bottom-left) */}
				<div className="absolute inset-x-0 bottom-6 px-5">
					<div className="max-w-4xl">
						<h1 className="font-heading text-2xl sm:text-3xl font-semibold text-white drop-shadow">
							{collection.name}
						</h1>
						{collection.description ? (
							<div className="mt-2 text-white/95 drop-shadow">
								<ExpandableText text={collection.description} maxChars={220} />
							</div>
						) : null}
					</div>
				</div>
			</div>

			{/* countdown (centered) */}
			{showCountdown && (
				<div className="mt-4 flex justify-center">
					<CountdownTimer target={when!} />
				</div>
			)}

			{/* Drops header */}
			<div className="mt-6 px-4 sm:px-6">
				<h2 className="font-heading text-lg sm:text-xl">Drops</h2>
			</div>

			{/* pieces grid */}
			<div className="px-4 sm:px-6 mt-4 pb-10">
				{pieces.length === 0 ? (
					<div className="rounded-2xl border border-stroke bg-surface p-6 text-text-muted">
						No pieces linked to this collection yet.
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
						{pieces.map((p) => (
							<button
								type="button"
								key={p.id}
								onClick={() => router.push(`/brand-space/piece/${p.id}`)}
								className="text-left rounded-2xl  p-2 hover:border-accent transition"
							>
								<div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-stroke">
									<img
										src={(p as any).mainVisualUrl}
										alt=""
										className="h-full w-full object-cover"
										loading="lazy"
										draggable={false}
									/>
								</div>
								<div className="px-2 mt-2">
									<div className="font-heading font-light">
										{(p as any).dropName}
									</div>
									<div
										className="mt-1 font-semibold text-sm"
										style={{
											fontFamily:
												"var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
										}}
									>
										{getCurrencyFromMap(p.currency)}{" "}
										{formatWithCommasDouble(p.price)}
									</div>
								</div>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
