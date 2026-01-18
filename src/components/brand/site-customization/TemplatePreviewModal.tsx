"use client";

import React, { useEffect } from "react";
import { X, Check, Lock, Smartphone, Monitor } from "lucide-react";
import Button from "@/components/ui/button";
import { Template } from "@/lib/models/site-customization";
import { cn } from "@/lib/utils";

// Placeholder imports for section components (will be created next)
import PreviewHero from "./preview/PreviewHero";
import PreviewFeaturedDrops from "./preview/PreviewFeaturedDrops";
import PreviewProductListing from "./preview/PreviewProductListing";
import PreviewBrandStory from "./preview/PreviewBrandStory";
import PreviewSocialProof from "./preview/PreviewSocialProof";
import PreviewFooter from "./preview/PreviewFooter";

interface TemplatePreviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	template: Template;
	isPro: boolean;
	isActive: boolean;
	onApply: (templateId: string) => void;
	onUpgrade: () => void;
}

export default function TemplatePreviewModal({
	isOpen,
	onClose,
	template,
	isPro,
	isActive,
	onApply,
	onUpgrade,
}: TemplatePreviewModalProps) {
	// Focus trap and body scroll lock
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			const handleEsc = (e: KeyboardEvent) => {
				if (e.key === "Escape") onClose();
			};
			window.addEventListener("keydown", handleEsc);
			return () => {
				document.body.style.overflow = "unset";
				window.removeEventListener("keydown", handleEsc);
			};
		}
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] flex flex-col bg-bg animate-in fade-in duration-200">
			{/* Top Bar */}
			<div className="h-16 flex items-center justify-between px-3 md:px-6 border-b border-stroke bg-surface/50 backdrop-blur-md sticky top-0 z-50">
				{/* Left: Template Info */}
				<div className="flex items-center gap-2 md:gap-4">
					<div>
						<h2 className="font-heading font-semibold text-base md:text-lg leading-tight">
							{template.name}
						</h2>
						<p className="text-xs text-text-muted hidden md:block">
							{template.description}
						</p>
					</div>
				</div>

				{/* Center: Badge */}
				<div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-2">
					<span className="px-3 py-1 bg-surface border border-stroke rounded-full text-xs font-medium text-text-muted shadow-sm">
						{isActive ? "Currently Active Template" : "Previewing Template"}
					</span>
				</div>

				{/* Right: Actions */}
				<div className="flex items-center gap-2 md:gap-3">
					{!isPro && template.isProOnly ? (
						<>
							<div className="hidden md:block">
								<Button
									text="Upgrade to use this template"
									variant="cta"
									leftIcon={<Lock className="w-4 h-4" />}
									onClick={onUpgrade}
									className="text-sm h-9"
								/>
							</div>
							<div className="md:hidden">
								<Button
									text="Upgrade"
									variant="cta"
									leftIcon={<Lock className="w-4 h-4" />}
									onClick={onUpgrade}
									className="text-xs h-8 px-3"
								/>
							</div>
						</>
					) : isActive ? (
						<Button
							text="Customize"
							variant="secondary"
							onClick={() => onApply(template.id)}
							leftIcon={<Check className="w-4 h-4" />}
							className="text-xs md:text-sm h-8 md:h-9 px-3 md:px-4"
						/>
					) : (
						<>
							<div className="hidden md:block">
								<Button
									text="Set as Active Template"
									variant="primary"
									onClick={() => onApply(template.id)}
									className="text-sm h-9"
								/>
							</div>
							<div className="md:hidden">
								<Button
									text="Use Template"
									variant="primary"
									onClick={() => onApply(template.id)}
									className="text-xs h-8 px-3"
								/>
							</div>
						</>
					)}

					<div className="h-6 w-px bg-stroke mx-0.5 md:mx-1" />

					<Button
						text="Close"
						variant="outline"
						onClick={onClose}
						leftIcon={<X className="w-4 h-4 md:w-5 md:h-5" />}
						className="text-xs md:text-sm h-8 md:h-9 px-2 hover:bg-stroke/10 border-transparent bg-transparent"
					/>
				</div>
			</div>

			{/* Preview Content Area */}
			<div className="flex-1 overflow-y-auto bg-black/5 dark:bg-white/5 p-4 md:p-8">
				<div className="w-full max-w-[1440px] mx-auto bg-bg min-h-full shadow-2xl rounded-lg overflow-hidden flex flex-col border border-stroke/20">
					{/* Mock Storefront Header (common to all templates in v1 preview) */}
					<header className="h-16 border-b border-dashed border-stroke/30 flex items-center justify-between px-8 bg-surface/10">
						<div className="w-24 h-6 bg-text/10 rounded" />
						<div className="flex gap-6">
							<div className="w-16 h-4 bg-text/5 rounded" />
							<div className="w-16 h-4 bg-text/5 rounded" />
							<div className="w-16 h-4 bg-text/5 rounded" />
						</div>
						<div className="w-8 h-8 rounded-full bg-text/5" />
					</header>

					{/* Sections Rendered from Schema */}
					<div className="flex-col flex">
						{(template.defaultSections || []).map((section) => {
							if (!section.enabled) return null;

							const key = section.id;

							switch (section.type) {
								case "hero":
									return <PreviewHero key={key} section={section as any} />;
								case "featuredDrops":
									return (
										<PreviewFeaturedDrops key={key} section={section as any} />
									);
								case "productListing":
									return (
										<PreviewProductListing key={key} section={section as any} />
									);
								case "brandStory":
									return (
										<PreviewBrandStory key={key} section={section as any} />
									);
								case "socialProof":
									return (
										<PreviewSocialProof key={key} section={section as any} />
									);
								case "footer":
									return <PreviewFooter key={key} section={section as any} />;
								default:
									return null;
							}
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
