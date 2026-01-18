import React from "react";
import { SocialProofSection } from "@/lib/models/site-customization";
import { Instagram, Twitter } from "lucide-react";

export default function PreviewSocialProof({
	section,
}: {
	section: SocialProofSection;
}) {
	const platform = section.platform ?? "instagram";
	const handle = section.handle ?? "@BRANDHANDLE";
	const followerCount = section.followerCount
		? `${(section.followerCount / 1000).toFixed(1)}k followers`
		: null;
	const showCta = section.showCta ?? true;

	return (
		<section className="relative w-full py-12 md:py-16 border-b border-dashed border-stroke/20 group overflow-hidden">
			<div className="absolute top-2 left-2 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] uppercase font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
				Social Proof
			</div>

			<div className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
				{/* Header */}
				<div className="flex flex-col items-center justify-center text-center space-y-1">
					<div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-text-muted">
						{platform === "instagram" ? (
							<Instagram className="w-4 h-4" />
						) : (
							<Twitter className="w-4 h-4" />
						)}
						<span>Seen on Instagram</span>
					</div>
					<div className="text-text text-base font-medium">
						{handle}{" "}
						{followerCount && (
							<span className="text-text-muted">· {followerCount}</span>
						)}
					</div>
				</div>

				{/* Content - Horizontal Scroll */}
				<div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible scrollbar-hide">
					{section.images && section.images.length > 0
						? section.images.map((imgUrl, i) => (
								<div
									key={i}
									className="flex-shrink-0 w-[200px] md:w-auto aspect-[4/5] bg-surface/20 relative group/item transition-colors rounded-sm overflow-hidden"
								>
									<img
										src={imgUrl}
										alt="Social Proof"
										className="w-full h-full object-cover"
									/>
								</div>
						  ))
						: Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									className="flex-shrink-0 w-[200px] md:w-auto aspect-[4/5] bg-surface/20 flex items-center justify-center relative group/item transition-colors rounded-sm"
								>
									{platform === "instagram" ? (
										<Instagram className="w-8 h-8 text-text-muted opacity-30" />
									) : (
										<Twitter className="w-8 h-8 text-text-muted opacity-30" />
									)}
								</div>
						  ))}
				</div>

				{/* Footer CTA */}
				{showCta && (
					<div className="text-center pt-2">
						<a
							href={`https://instagram.com/${handle.replace("@", "")}`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center text-sm font-medium text-text hover:text-accent transition-colors"
						>
							View on Instagram <span className="ml-1">→</span>
						</a>
					</div>
				)}
			</div>
		</section>
	);
}
