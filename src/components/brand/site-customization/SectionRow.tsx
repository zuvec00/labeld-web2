"use client";

import React from "react";
import { GripVertical, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { StorefrontSection } from "@/lib/models/site-customization";
import { cn } from "@/lib/utils";

interface SectionRowProps {
	section: StorefrontSection;
	index: number;
	isPro: boolean;
	onToggle: (sectionId: string, enabled: boolean) => void;
	onDragStart?: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
	onDragOver?: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
	onDrop?: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
	onLockedClick?: () => void;
	isSelected?: boolean;
	onClick?: () => void;
}

export default function SectionRow({
	section,
	index,
	isPro,
	onToggle,
	onDragStart,
	onDragOver,
	onDrop,
	onLockedClick,
	isSelected,
	onClick,
}: SectionRowProps) {
	// Helper to get readable name
	const getSectionName = (type: string) => {
		switch (type) {
			case "hero":
				return "Hero Banner";
			case "featuredDrops":
				return "Featured Drops";
			case "productListing":
				return "Product Collection";
			case "brandStory":
				return "Brand Story";
			case "socialProof":
				return "Social Proof";
			case "footer":
				return "Footer";
			default:
				return type;
		}
	};

	// Helper to get description
	const getSectionDescription = (type: string) => {
		switch (type) {
			case "hero":
				return "Main visual banner at the top of your page.";
			case "featuredDrops":
				return "Highlight specific drops or collections.";
			case "productListing":
				return "Your main catalog grid (Required).";
			case "brandStory":
				return "A section to tell your brand's narrative.";
			case "socialProof":
				return "Showcase instagram feed or testimonials.";
			case "footer":
				return "Site navigation and copyright (Required).";
			default:
				return "Custom section";
		}
	};

	const isRequired = section.isRequired;
	const isDraggable = isPro && !section.isLocked;
	// Footer is usually locked at bottom, but for this V1 lets assume standard sections are reorderable
	// EXCEPT if explicitly isLocked is set.

	const handleInteraction = (e: React.MouseEvent) => {
		if (!isPro && onLockedClick) {
			e.preventDefault();
			e.stopPropagation();
			onLockedClick();
		}
	};

	return (
		<div
			draggable={isDraggable}
			onDragStart={(e) => isDraggable && onDragStart && onDragStart(e, index)}
			onDragOver={(e) => isDraggable && onDragOver && onDragOver(e, index)}
			onDrop={(e) => isDraggable && onDrop && onDrop(e, index)}
			className={cn(
				"group relative flex items-center gap-4 p-4 rounded-lg transition-all",
				// Base styles
				!section.enabled && "opacity-60 bg-surface/50",
				isDraggable ? "cursor-move" : "cursor-pointer", // It's pointer if selectable
				!isPro && "opacity-75",

				// Selection State
				isSelected
					? "bg-surface ring-2 ring-text/10 shadow-sm border-transparent" // Active
					: "bg-surface border border-stroke hover:border-text/30" // Inactive
			)}
			onClick={(e) => {
				handleInteraction(e);
				onClick && onClick();
			}}
		>
			{/* Drag Handle or Lock */}
			<div className="text-text-muted/40">
				{!isPro ? (
					<Lock className="w-4 h-4" />
				) : (
					<GripVertical
						className={cn(
							"w-5 h-5",
							isDraggable ? "group-hover:text-text-muted" : "opacity-20"
						)}
					/>
				)}
			</div>

			{/* Info */}
			<div className="flex-1 min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<h4 className="font-medium text-text text-sm truncate max-w-full">
						{getSectionName(section.type)}
					</h4>
					{isRequired && (
						<span className="text-[10px] uppercase font-bold text-text-muted/60 bg-stroke/30 px-1.5 py-0.5 rounded flex-shrink-0">
							Required
						</span>
					)}
					{!section.enabled && (
						<span className="text-[10px] uppercase font-bold text-text-muted/60 border border-stroke px-1.5 py-0.5 rounded flex-shrink-0">
							Hidden
						</span>
					)}
				</div>
				<p className="text-xs text-text-muted mt-0.5 line-clamp-1 break-words">
					{getSectionDescription(section.type)}
				</p>
			</div>

			{/* Toggle */}
			<div
				onClick={(e) => e.stopPropagation()}
				title={isRequired ? "This section is required" : undefined}
			>
				<Switch
					className="data-[state=checked]:bg-cta border-transparent"
					checked={isRequired ? true : section.enabled}
					disabled={!isPro || isRequired}
					onCheckedChange={(checked) =>
						!isRequired && onToggle(section.id, checked)
					}
				/>
			</div>

			{/* Free Overlay (Invisible click capture is handled by wrapper, but maybe visual hint needed?) */}
		</div>
	);
}
