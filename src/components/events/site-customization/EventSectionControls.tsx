"use client";

import React, { useState } from "react";
import EventSectionRow from "@/components/events/site-customization/EventSectionRow";
import { EventSection } from "@/lib/models/eventSite";

interface EventSectionControlsProps {
	sections: EventSection[];
	isPro: boolean;
	onReorder: (newSections: EventSection[]) => void;
	onToggle: (sectionId: string, enabled: boolean) => void;
	onLockedAction: () => void;
	selectedSectionId?: string | null;
	onSelect?: (sectionId: string) => void;
}

export default function EventSectionControls({
	sections,
	isPro,
	onReorder,
	onToggle,
	onLockedAction,
	selectedSectionId,
	onSelect,
}: EventSectionControlsProps) {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	// Basic HTML5 DnD Handlers
	const handleDragStart = (
		e: React.DragEvent<HTMLDivElement>,
		index: number,
	) => {
		setDraggedIndex(index);
		// Effect: dim the item being dragged slightly
		e.dataTransfer.effectAllowed = "move";
		// Ghost image setting if needed, browser default usually ok
	};

	const handleDragOver = (
		e: React.DragEvent<HTMLDivElement>,
		index: number,
	) => {
		e.preventDefault(); // Necessary to allow dropping
		if (draggedIndex === null || draggedIndex === index) return;

		// Optional: We could do live reordering here for smoother visual,
		// but for V1, let's stick to Drop-to-Update to avoid flicker without complex animation lib
	};

	const handleDrop = (
		e: React.DragEvent<HTMLDivElement>,
		dropIndex: number,
	) => {
		e.preventDefault();
		if (draggedIndex === null) return;

		// Reorder logic
		const newSections = [...sections];
		const [movedItem] = newSections.splice(draggedIndex, 1);
		newSections.splice(dropIndex, 0, movedItem);

		onReorder(newSections);
		setDraggedIndex(null);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-heading font-semibold text-lg flex items-center gap-2">
					Page Structure
					<span className="text-xs bg-bg-subtle text-text-muted px-2 py-0.5 rounded font-normal border border-stroke">
						{sections.filter((s) => s.enabled).length} Enabled
					</span>
				</h3>
				{!isPro && (
					<span className="text-xs text-text-muted italic hidden md:inline-block">
						Unlock Pro to reorder sections
					</span>
				)}
			</div>

			<div className="space-y-2">
				{sections.map((section, index) => (
					<EventSectionRow
						key={section.id}
						index={index}
						section={section}
						isPro={isPro}
						onToggle={onToggle}
						onDragStart={handleDragStart}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						onLockedClick={onLockedAction}
						isSelected={selectedSectionId === section.id}
						onClick={() => onSelect && onSelect(section.id)}
					/>
				))}
			</div>
		</div>
	);
}
