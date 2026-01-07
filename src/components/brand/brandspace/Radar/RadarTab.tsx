// src/components/brand/brandspace/Radar/RadarTab.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DropContent, fetchBrandContents } from "@/lib/models/radar_feed";
import BrandFeedCard from "../BrandFeedCard";
import { deleteDropContent } from "@/lib/firebase/queries/dropContent";
import { Plus } from "lucide-react";
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

	// User wants card click to go to edit page
	const onOpen = (c: DropContent) => {
		router.push(`/brand-space/drop-content/${c.id}/edit`);
	};

	// FAB component for reuse or just inline
	const Fab = () => (
		<button
			onClick={() => router.push("/radar/new")}
			className="fixed bottom-8 right-6 z-50 h-14 w-14 rounded-full bg-accent text-bg shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
			title="Drop a Moment"
		>
			<Plus className="w-6 h-6" />
		</button>
	);

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
			<div className="px-4 sm:px-6 py-16 text-center relative min-h-[50vh]">
				<img
					src="/images/empty-radar.png"
					alt=""
					className="mx-auto mb-4 opacity-80 max-w-[220px]"
				/>
				<p className="text-text-muted">
					{isBrand
						? "Create your first moment to start the feed."
						: "No Radar content yet. Check back later for this brand's latest drops."}
				</p>
				{isBrand && <Fab />}
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
		<div className="px-4 sm:px-6 pb-20">
			{/* CSS Masonry: 1 / 2 / 3 / 4 columns */}
			<div className="columns-2 sm:columns-2 lg:columns-4 2xl:columns-4 gap-4">
				{items.map((c) => (
					<BrandFeedCard
						key={c.id}
						content={c}
						isBrand={isBrand}
						onOpen={onOpen}
						// No edit/delete props passed, forcing clean card
					/>
				))}
			</div>
			{isBrand && <Fab />}
		</div>
	);
}
