// src/components/brand/brandspace/Radar/BrandFeedCard.tsx
"use client";

import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DropContent } from "@/lib/models/radar_feed";
import DropStatusCapsule from "./DropStatusCapsule";

export default function BrandFeedCard({
	content,
	isBrand = true,
	onOpen,
	onEdit,
	onDelete,
}: {
	content: DropContent;
	isBrand?: boolean; // dashboard: true by default
	onOpen?: (c: DropContent) => void;
	onEdit?: (c: DropContent) => void;
	onDelete?: (c: DropContent) => void;
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

				{/* edit/delete like Flutter (right-top) */}
				{isBrand && (
					<div className="absolute right-3 top-3 flex items-center gap-2">
						<button
							onClick={(e) => {
								e.stopPropagation();
								onEdit?.(content);
							}}
							className="p-2 rounded-lg bg-bg/80 backdrop-blur border border-stroke hover:bg-bg"
							aria-label="Edit"
							title="Edit"
						>
							<Pencil className="h-4 w-4 text-[var(--edit,#06b6d4)]" />
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation();
								onDelete?.(content);
							}}
							className="p-2 rounded-lg bg-bg/80 backdrop-blur border border-stroke hover:bg-bg"
							aria-label="Delete"
							title="Delete"
						>
							<Trash2 className="h-4 w-4 text-[var(--alert,#ef4444)]" />
						</button>
					</div>
				)}
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
