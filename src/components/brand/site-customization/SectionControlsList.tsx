"use client";

import React, { useState, useRef } from "react";
import SectionRow from "@/components/brand/site-customization/SectionRow";
import { StorefrontSection } from "@/lib/models/site-customization";

interface SectionControlsListProps {
	sections: StorefrontSection[];
	isPro: boolean;
	onReorder: (newSections: StorefrontSection[]) => void;
	onToggle: (sectionId: string, enabled: boolean) => void;
	onLockedAction: () => void;
	selectedSectionId?: string | null;
	onSelect?: (sectionId: string) => void;
}

export default function SectionControlsList({
	sections,
	isPro,
	onReorder,
	onToggle,
	onLockedAction,
	selectedSectionId,
	onSelect,
}: SectionControlsListProps) {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	// Basic HTML5 DnD Handlers
	const handleDragStart = (
		e: React.DragEvent<HTMLDivElement>,
		index: number
	) => {
		setDraggedIndex(index);
		// Effect: dim the item being dragged slightly
		e.dataTransfer.effectAllowed = "move";
		// Ghost image setting if needed, browser default usually ok
	};

	const handleDragOver = (
		e: React.DragEvent<HTMLDivElement>,
		index: number
	) => {
		e.preventDefault(); // Necessary to allow dropping
		if (draggedIndex === null || draggedIndex === index) return;

		// Optional: We could do live reordering here for smoother visual,
		// but for V1, let's stick to Drop-to-Update to avoid flicker without complex animation lib
	};

	const handleDrop = (
		e: React.DragEvent<HTMLDivElement>,
		dropIndex: number
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
				<h3 className="font-heading font-semibold text-lg">
					Homepage Sections
				</h3>
				{!isPro && (
					<span className="text-xs text-text-muted italic">
						Unlock Pro to reorder sections
					</span>
				)}
			</div>

			<div className="space-y-2">
				{sections.map((section, index) => (
					<SectionRow
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
