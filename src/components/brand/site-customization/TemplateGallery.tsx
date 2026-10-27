"use client";

import React, { useState } from "react";
import TemplateCard from "@/components/brand/site-customization/TemplateCard";
import TemplatePreviewModal from "@/components/brand/site-customization/TemplatePreviewModal";
import { Template } from "@/lib/models/site-customization";
import {
	getThemeAccess,
	getThemePriceMinor,
	isThemeListed,
} from "@/lib/plans/theme-access";
import { Layout } from "lucide-react"; // Fallback icon

interface TemplateGalleryProps {
	templates: Template[];
	isPro: boolean;
	/** Premium theme ids this brand owns. */
	entitledThemeIds: Set<string>;
	activeTemplateId?: string | null;
	onApply: (templateId: string) => void;
	onUpgrade: () => void;
	onPurchase: (template: Template) => void;
}

export default function TemplateGallery({
	templates: allTemplates,
	isPro,
	entitledThemeIds,
	activeTemplateId,
	onApply,
	onUpgrade,
	onPurchase,
}: TemplateGalleryProps) {
	// State for preview modal
	const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

	// Same rule as mobile: unreleased themes stay hidden unless already owned.
	const templates = (allTemplates ?? []).filter((t) =>
		isThemeListed(t, entitledThemeIds),
	);
	const included = templates.filter((t) => t.access !== "premium");
	const premium = templates.filter((t) => t.access === "premium");

	const renderCard = (template: Template) => (
		<TemplateCard
			key={template.id}
			template={template}
			isActive={activeTemplateId === template.id}
			access={getThemeAccess(template, isPro, entitledThemeIds)}
			priceMinor={getThemePriceMinor(template, isPro)}
			onPreview={setPreviewTemplate}
			onUpgrade={onUpgrade}
			onPurchase={onPurchase}
			onActivate={onApply}
		/>
	);

	// Empty State Helper
	if (templates.length === 0) {
		return (
			<div className="py-24 text-center border border-dashed border-stroke rounded-2xl bg-surface/5">
				<div className="w-12 h-12 bg-stroke/10 rounded-full flex items-center justify-center mx-auto mb-4">
					<Layout className="w-6 h-6 text-text-muted/50" />
				</div>
				<h3 className="text-text font-medium mb-1">No templates available</h3>
				<p className="text-text-muted text-sm max-w-xs mx-auto">
					We couldn't load the template library. Please try reloading or contact
					support.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			{/* Gallery Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stroke pb-6">
				<div>
					<h3 className="font-heading font-bold text-2xl text-text mb-2">
						Storefront Templates
					</h3>
					<p className="text-text-muted text-sm max-w-xl leading-relaxed">
						Launch with Essential for free. Pro unlocks more curated,
						high-performance layouts as your brand grows.
					</p>
				</div>
				<div className="text-xs font-medium text-text-muted bg-surface border border-stroke px-3 py-1.5 rounded-full self-start md:self-auto">
					{templates.length} Layouts Available
				</div>
			</div>

			{/* Included templates */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{included.map(renderCard)}
			</div>

			{/* Premium templates: bought separately */}
			{premium.length > 0 && (
				<div className="space-y-4">
					<div>
						<h4 className="font-heading font-semibold text-lg text-text">
							Premium themes
						</h4>
						<p className="text-text-muted text-sm">
							One-time purchase. Requires an active Pro plan.
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{premium.map(renderCard)}
					</div>
				</div>
			)}

			{/* Preview Modal */}
			<TemplatePreviewModal
				isOpen={!!previewTemplate}
				onClose={() => setPreviewTemplate(null)}
				template={previewTemplate!}
				access={
					previewTemplate
						? getThemeAccess(previewTemplate, isPro, entitledThemeIds)
						: "available"
				}
				priceMinor={previewTemplate ? getThemePriceMinor(previewTemplate, isPro) : null}
				isActive={previewTemplate?.id === activeTemplateId}
				onApply={(id) => {
					onApply(id);
					setPreviewTemplate(null);
				}}
				onUpgrade={() => {
					setPreviewTemplate(null);
					onUpgrade();
				}}
				onPurchase={(t) => {
					setPreviewTemplate(null);
					onPurchase(t);
				}}
			/>
		</div>
	);
}
