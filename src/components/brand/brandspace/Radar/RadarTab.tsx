// src/components/brand/brandspace/Radar/RadarTab.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DropContent, fetchBrandContents } from "@/lib/models/radar_feed";
import BrandFeedCard from "../BrandFeedCard";
import { deleteDropContent } from "@/lib/firebase/queries/dropContent";
import Button from "@/components/ui/button";

function ShimmerCard({ h = 240 }: { h?: number }) {
	return (
		<div className="mb-4 break-inside-avoid">
			<div
				className="rounded-2xl bg-surface/60 border border-stroke animate-pulse"
				style={{ height: h }}
			/>
		</div>
	);
}

export default function RadarTab({
	brandId,
	isBrand = true,
}: {
	brandId: string;
	isBrand?: boolean;
}) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);
	const [items, setItems] = useState<DropContent[]>([]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const data = await fetchBrandContents(brandId);
				console.log("RadarTab: Loaded items:", data.length, data);
				if (!mounted) return;
				setItems(data);
				setErr(null);
			} catch (e) {
				if (!mounted) return;
				console.error("RadarTab: Error loading items:", e);
				setErr((e as string) ?? "Failed to load feed");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [brandId]);

	const onOpen = (c: DropContent) => {
		router.push(`/brand-space/feed/${c.id}`); // route however you prefer
	};

	const onEdit = (c: DropContent) => {
		router.push(`/brand-space/drop-content/${c.id}/edit`);
	};

	const onDelete = async (c: DropContent) => {
		if (!confirm("Delete this content?")) return;
		await deleteDropContent(c.id, c.brandId);
		setItems((prev) => prev.filter((x) => x.id !== c.id));
	};

	// random-ish heights for skeleton variety
	const skeletonHeights = useMemo(
		() => [220, 300, 260, 340, 280, 320, 240, 360],
		[]
	);

	if (loading) {
		return (
			<div className="px-4 sm:px-6">
				<div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<ShimmerCard
							key={i}
							h={skeletonHeights[i % skeletonHeights.length]}
						/>
					))}
				</div>
			</div>
		);
	}

	if (err) {
		return (
			<div className="px-4 sm:px-6 py-10 text-center">
				<p className="text-text-muted">{err}</p>
			</div>
		);
	}

	if (items.length === 0) {
		console.log(
			"RadarTab: Showing empty state, items.length:",
			items.length,
			"isBrand:",
			isBrand
		);
		return (
			<div className="px-4 sm:px-6 py-16 text-center">
				{isBrand && (
					<div className="flex justify-end mb-8">
						<Button
							text="Drop a Moment"
							variant="primary"
							onClick={() => {
								console.log("Drop a Moment button clicked (empty state)");
								router.push("/radar/new");
							}}
						/>
					</div>
				)}
				<img
					src="/images/empty-radar.png"
					alt=""
					className="mx-auto mb-4 opacity-80 max-w-[220px]"
				/>
				<p className="text-text-muted">
					{isBrand
						? "Drop your next content here and keep your audience in the loop."
						: "No Radar content yet. Check back later for this brand's latest drops."}
				</p>
			</div>
		);
	}

	console.log(
		"RadarTab: Showing items grid, items.length:",
		items.length,
		"isBrand:",
		isBrand
	);
	return (
		<div className="px-4 sm:px-6">
			{isBrand && (
				<div className="flex justify-end mb-8">
					<Button
						text="Drop a Moment"
						variant="primary"
						onClick={() => {
							console.log("Drop a Moment button clicked (from grid view)");
							router.push("/radar/new");
						}}
					/>
				</div>
			)}
			{/* CSS Masonry: 1 / 2 / 3 / 4 columns */}
			<div className="columns-2 sm:columns-2 lg:columns-4 2xl:columns-4 gap-4">
				{items.map((c) => (
					<BrandFeedCard
						key={c.id}
						content={c}
						isBrand={isBrand}
						onOpen={onOpen}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))}
			</div>
		</div>
	);
}
