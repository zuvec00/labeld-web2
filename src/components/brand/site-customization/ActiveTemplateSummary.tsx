"use client";

import React from "react";
import Button from "@/components/ui/button";
import { Template } from "@/lib/models/site-customization";
import { ExternalLink, RefreshCw, Check } from "lucide-react";

interface ActiveTemplateSummaryProps {
	template: Template;
	onPreview: () => void;
	onChangeTemplate: () => void;
}

export default function ActiveTemplateSummary({
	template,
	onPreview,
	onChangeTemplate,
}: ActiveTemplateSummaryProps) {
	return (
		<div className="bg-surface rounded-xl border border-stroke p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
			{/* Left: Info */}
			<div className="flex items-start sm:items-center gap-4 w-full md:w-auto">
				{/* Thumbnail Preview */}
				<div className="w-16 h-12 flex-shrink-0 bg-stroke/30 rounded border border-stroke overflow-hidden relative hidden xs:block">
					{template.previewImage ? (
						<div
							className="absolute inset-0 bg-cover bg-center"
							style={{ backgroundImage: `url(${template.previewImage})` }}
						/>
					) : (
						<div className="absolute inset-0 bg-gradient-to-br from-stroke/20 to-stroke/40" />
					)}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex flex-wrap items-center gap-2 mb-1">
						<h3 className="font-heading font-bold text-lg text-text truncate">
							{template.name}
						</h3>
						<span className="flex-shrink-0 flex items-center gap-1 text-[10px] uppercase font-bold text-bg bg-accent px-2 py-0.5 rounded-full">
							<Check className="w-3 h-3" />
							Active
						</span>
					</div>
					<p className="text-sm text-text-muted max-w-md line-clamp-2">
						{template.description}
					</p>
				</div>
			</div>

			{/* Right: Actions */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
				<Button
					text="Preview Store"
					variant="outline"
					leftIcon={<ExternalLink className="w-4 h-4" />}
					onClick={onPreview}
					className="h-10 sm:h-9 flex-1 sm:flex-none justify-center"
				/>
				<Button
					text="Change Template"
					variant="secondary"
					leftIcon={<RefreshCw className="w-4 h-4" />}
					onClick={onChangeTemplate}
					className="h-10 sm:h-9 flex-1 sm:flex-none justify-center"
				/>
			</div>
		</div>
	);
}
