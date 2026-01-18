import React from "react";
import { HeroSection } from "@/lib/models/site-customization";
import { cn } from "@/lib/utils";

export default function PreviewHero({ section }: { section: HeroSection }) {
	const isMinimal = section.variant === "minimal";

	return (
		<section className="relative w-full border-b border-dashed border-stroke/20 group overflow-hidden">
			{/* Label (Hover only) */}
			<div className="absolute top-2 left-2 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] uppercase font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
				Hero ({section.variant})
			</div>

			<div
				className={cn(
					"w-full bg-surface-2 flex flex-col items-center justify-center text-center px-6 relative",
					isMinimal ? "py-12 min-h-[250px]" : "py-20 min-h-[400px]"
				)}
			>
				{/* Background Visuals (Premium Placeholder) */}
				<div className="absolute inset-0 bg-gradient-to-tr from-surface-2 via-surface to-surface-2 opacity-50 z-0" />
				{/* Subtle pattern to hint at "Image" without being noisy */}
				<div
					className={cn(
						"absolute inset-0 z-0 mix-blend-multiply dark:mix-blend-screen",
						section.imageUrl ? "opacity-100" : "opacity-[0.03]"
					)}
					style={{
						backgroundImage: section.imageUrl
							? `url(${section.imageUrl})`
							: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
						backgroundSize: section.imageUrl ? "cover" : "auto",
						backgroundPosition: "center",
					}}
				/>

				<div className="relative z-10 max-w-lg space-y-4">
					<h1
						className={cn(
							"font-heading font-bold text-text tracking-tight",
							isMinimal
								? "text-2xl md:text-3xl"
								: "text-3xl md:text-5xl leading-tight"
						)}
					>
						{section.headline}
					</h1>

					{/* Subheadline: Only show if exists (Strict) */}
					{section.subheadline && (
						<p className="text-text-muted text-sm md:text-base max-w-sm mx-auto leading-relaxed">
							{section.subheadline}
						</p>
					)}

					{section.primaryCta && (
						<div className="pt-4">
							<div className="px-6 py-2.5 bg-text text-bg rounded-sm text-[11px] md:text-xs font-bold uppercase tracking-widest inline-flex items-center justify-center shadow-sm">
								{section.primaryCta.label}
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
