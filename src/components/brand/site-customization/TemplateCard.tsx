"use client";

import React from "react";
import Image from "next/image";
import { Lock, Check } from "lucide-react";
import Button from "@/components/ui/button";
import { Template } from "@/lib/models/site-customization";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
	template: Template;
	isActive: boolean;
	isProUser: boolean;
	onPreview: (template: Template) => void;
	onUpgrade: () => void;
	onActivate: (templateId: string) => void;
}

export default function TemplateCard({
	template,
	isActive,
	isProUser,
	onPreview,
	onUpgrade,
	onActivate,
}: TemplateCardProps) {
	// Logic: Locked if user is NOT pro AND template is Pro Only
	const isLocked = !isProUser && template.isProOnly;

	return (
		<div
			className={cn(
				"group relative rounded-2xl border transition-all overflow-hidden flex flex-col",
				isActive
					? "border-accent ring-1 ring-accent bg-accent/5"
					: "border-stroke bg-surface hover:border-accent/50 hover:shadow-lg"
			)}
		>
			{/* Thumbnail Area */}
			<div className="aspect-[4/3] bg-stroke/30 relative overflow-hidden">
				{/* Placeholder Gradient based on template role */}
				<div
					className={cn(
						"absolute inset-0 bg-gradient-to-br",
						template.templateRole === "essential"
							? "from-surface to-stroke/40"
							: template.templateRole === "editorial"
							? "from-accent/5 to-accent/10"
							: "from-blue-500/5 to-purple-500/5"
					)}
				/>

				{/* Placeholder Text / Thumbnail */}
				{template.previewImage ? (
					// In real app, render image here
					<div
						className="absolute inset-0 bg-cover bg-center"
						style={{ backgroundImage: `url(${template.previewImage})` }}
					/>
				) : (
					<div className="absolute inset-0 flex items-center justify-center text-text-muted/20 font-heading text-2xl md:text-3xl font-bold uppercase select-none tracking-widest">
						{template.name}
					</div>
				)}

				{/* Locked Overlay */}
				{isLocked && (
					<div className="absolute top-2 right-2 z-10">
						<div className="w-8 h-8 rounded-full bg-surface shadow-sm flex items-center justify-center border border-stroke">
							<Lock className="w-4 h-4 text-text-muted" />
						</div>
					</div>
				)}

				{/* Active Badge */}
				{isActive && (
					<div className="absolute top-2 left-2 z-10">
						<span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-bg bg-accent px-2.5 py-1 rounded-full shadow-sm">
							<Check className="w-3 h-3" />
							Active
						</span>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="p-5 flex flex-col flex-grow">
				<div className="mb-2">
					<div className="flex justify-between items-start mb-1">
						<h4 className="font-heading font-semibold text-text text-lg">
							{template.name}
						</h4>
					</div>

					{/* Tags */}
					{template.tags && template.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mb-3">
							{template.tags.slice(0, 3).map((tag) => (
								<span
									key={tag}
									className="px-1.5 py-0.5 rounded-md bg-stroke/20 text-text-muted text-[10px] font-medium uppercase tracking-wide"
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</div>

				<p className="text-xs text-text-muted mb-4 line-clamp-2 flex-grow leading-relaxed">
					{template.description}
				</p>

				<div className="grid grid-cols-2 gap-3 mt-auto">
					<Button
						text="Preview"
						variant="secondary"
						className="w-full text-xs h-9"
						onClick={() => onPreview(template)}
					/>

					{/* Action Button Logic */}
					{isLocked ? (
						<Button
							text="Upgrade"
							variant="outline" // Calm upgrade
							leftIcon={<Lock className="w-3 h-3" />}
							className="w-full text-xs h-9"
							onClick={onUpgrade}
						/>
					) : isActive ? (
						<Button
							text="Active"
							variant="outline"
							className="w-full text-xs h-9 opacity-50 cursor-default"
							disabled
						/>
					) : (
						<Button
							text="Activate"
							variant="primary"
							className="w-full text-xs h-9"
							onClick={() => onActivate(template.id)}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
