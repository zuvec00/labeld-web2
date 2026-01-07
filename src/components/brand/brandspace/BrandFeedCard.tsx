// src/components/brand/brandspace/Radar/BrandFeedCard.tsx
"use client";

import React from "react";
import { Flame } from "lucide-react";
import { DropContent } from "@/lib/models/radar_feed";
import DropStatusCapsule from "./DropStatusCapsule";

export default function BrandFeedCard({
	content,
	isBrand = true,
	onOpen,
}: {
	content: DropContent;
	isBrand?: boolean; // dashboard: true by default
	onOpen?: (c: DropContent) => void;
}) {
	return (
		<div className="mb-4 break-inside-avoid">
			<div
				className="relative rounded-2xl overflow-hidden"
				role="button"
				onClick={() => onOpen?.(content)}
			>
				<img
					src={content.teaserImageUrl}
					alt={content.momentName || "Drop"}
					className="w-full h-auto block"
				/>

				{/* bottom-left capsule like Flutter */}
				<div className="absolute left-3 bottom-3">
					<DropStatusCapsule launchDate={content.launchDate ?? null} />
				</div>

				{/* Reaction Signal (Fire) */}
				<div className="absolute right-3 bottom-3">
					<div className="flex items-center gap-1 bg-black/50 backdrop-blur rounded-full px-2 py-1 text-white text-xs font-bold">
						<Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
						<span>
							{Object.values(content.reactions || {}).reduce(
								(a, b) => a + b,
								0
							)}
						</span>
					</div>
				</div>

				{/* edit/delete removed - clicks go to edit page */}
			</div>

			{/* Optionally show title below (Flutter currently hides) */}
			{content.momentName && (
				<div className="mt-2 text-sm font-heading font-medium">
					{content.momentName}
				</div>
			)}
		</div>
	);
}
