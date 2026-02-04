"use client";

import React from "react";
import { GripVertical, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { EventSection, EventSectionType } from "@/lib/models/eventSite";
import { cn } from "@/lib/utils";

interface EventSectionRowProps {
	section: EventSection;
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

export default function EventSectionRow({
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
}: EventSectionRowProps) {
	// Helper to get readable name
	const getSectionName = (type: EventSectionType) => {
		switch (type) {
			case "hero":
				return "Hero Banner";
			case "featuredEvent":
				return "Featured Event";
			case "upcomingEvents":
				return "Upcoming Events";
			case "pastEvents":
				return "Past Events";
			case "gallery":
				return "Gallery";
			case "venueInfo":
				return "Venue Info";
			case "aboutOrganizer":
				return "About Organizer";
			case "faq":
				return "FAQ";
			case "socialProof":
				return "Social Proof";
			case "footer":
				return "Footer";
			default:
				return type;
		}
	};

	// Helper to get description
	const getSectionDescription = (type: EventSectionType) => {
		switch (type) {
			case "hero":
				return "Main visual banner at the top of your page.";
			case "featuredEvent":
				return "Highlight your next big event or a specific one.";
			case "upcomingEvents":
				return "Your main event usage grid (Required).";
			case "pastEvents":
				return "Showcase previous successful events.";
			case "gallery":
				return "Photo grid or carousel of event vibes.";
			case "venueInfo":
				return "Location details and map for physical venues.";
			case "aboutOrganizer":
				return "Tell your story and mission.";
			case "faq":
				return "Answer common questions about tickets, etc.";
			case "socialProof":
				return "Display testimonials or social feeds.";
			case "footer":
				return "Site navigation and copyright (Required).";
			default:
				return "Custom section";
		}
	};

	const isRequired = section.isRequired;
	const isDraggable = isPro && !section.isLocked;

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
					: "bg-surface border border-stroke hover:border-text/30", // Inactive
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
							isDraggable ? "group-hover:text-text-muted" : "opacity-20",
						)}
					/>
				)}
			</div>

			{/* Info */}
			<div className="flex-1 min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<h4 className="font-medium text-text text-sm truncate max-w-full">
						{section.title || getSectionName(section.type)}
					</h4>
					{isRequired && (
						<span className="text-[10px] uppercase font-bold text-text-muted/60 bg-stroke/30 px-1.5 py-0.5 rounded flex-shrink-0">
							Required
						</span>
					)}
					{!section.enabled && !isRequired && (
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
					className="data-[state=checked]:bg-events border-transparent"
					checked={isRequired ? true : section.enabled}
					disabled={!isPro || isRequired}
					onCheckedChange={(checked) =>
						!isRequired && onToggle(section.id, checked)
					}
				/>
			</div>
		</div>
	);
}
