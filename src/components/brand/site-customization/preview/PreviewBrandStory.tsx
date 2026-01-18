import React from "react";
import { BrandStorySection } from "@/lib/models/site-customization";

export default function PreviewBrandStory({
	section,
}: {
	section: BrandStorySection;
}) {
	return (
		<section className="relative w-full py-16 px-6 border-b border-dashed border-stroke/20 group bg-surface-2/50">
			{/* Label (Hover only) */}
			<div className="absolute top-2 left-2 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] uppercase font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
				Brand Story
			</div>

			<div className="max-w-2xl mx-auto text-center space-y-6">
				{section.title && (
					<h3 className="font-heading text-xl md:text-2xl font-serif italic text-text tracking-tight">
						{section.title}
					</h3>
				)}

				<div className="relative">
					<span className="absolute -top-4 -left-2 text-4xl text-text-muted/10 font-serif leading-none">
						“
					</span>
					<p className="text-sm md:text-base text-text-muted leading-relaxed font-light px-4">
						{section.content}
					</p>
					<span className="absolute -bottom-8 -right-2 text-4xl text-text-muted/10 font-serif leading-none">
						”
					</span>
				</div>

				<div className="w-8 h-px bg-stroke mx-auto mt-8 opacity-50" />
			</div>
		</section>
	);
}
