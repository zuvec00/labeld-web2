"use client";

import React, { useState } from "react";
import TemplateCard from "@/components/brand/site-customization/TemplateCard";
import TemplatePreviewModal from "@/components/brand/site-customization/TemplatePreviewModal";
import { Template } from "@/lib/models/site-customization";
import { Layout } from "lucide-react"; // Fallback icon

interface TemplateGalleryProps {
	templates: Template[];
	isPro: boolean;
	activeTemplateId?: string | null;
	onApply: (templateId: string) => void;
	onUpgrade: () => void;
}

export default function TemplateGallery({
	templates,
	isPro,
	activeTemplateId,
	onApply,
	onUpgrade,
}: TemplateGalleryProps) {
	// State for preview modal
	const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

	// Empty State Helper
	if (!templates || templates.length === 0) {
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
						Choose how your brand is presented to the world. Pro members can
						switch between curated, high-performance layouts instantly.
					</p>
				</div>
				<div className="text-xs font-medium text-text-muted bg-surface border border-stroke px-3 py-1.5 rounded-full self-start md:self-auto">
					{templates.length} Layouts Available
				</div>
			</div>

			{/* Template Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{templates.map((template) => {
					// Active Logic:
					const isActive = activeTemplateId === template.id;

					return (
						<TemplateCard
							key={template.id}
							template={template}
							isActive={isActive}
							isProUser={isPro}
							onPreview={setPreviewTemplate}
							onUpgrade={onUpgrade}
							onActivate={onApply}
						/>
					);
				})}
			</div>

			{/* Preview Modal */}
			<TemplatePreviewModal
				isOpen={!!previewTemplate}
				onClose={() => setPreviewTemplate(null)}
				template={previewTemplate!}
				isPro={isPro}
				isActive={isPro && previewTemplate?.id === activeTemplateId}
				onApply={(id) => {
					onApply(id);
					setPreviewTemplate(null);
				}}
				onUpgrade={() => {
					setPreviewTemplate(null);
					onUpgrade();
				}}
			/>
		</div>
	);
}
