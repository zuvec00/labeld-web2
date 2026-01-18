import React from "react";
import { FeaturedDropsSection } from "@/lib/models/site-customization";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PreviewFeaturedDrops({
	section,
	collectionsLookup = [],
}: {
	section: FeaturedDropsSection;
	collectionsLookup?: {
		id: string;
		name: string;
		status: string;
		image: string;
		launchDate: Date | null;
	}[];
}) {
	// If we have real collections selected, use them. Otherwise show mock placeholders.
	const hasSelection =
		section.collectionIds && section.collectionIds.length > 0;

	// Helper to format status based on mode
	const getStatusText = (item: any) => {
		const mode = section.dropStatusMode ?? "relative";

		// Mock Item Handling
		if (item.id.startsWith("mock-")) return item.status;

		// Real Item handling
		if (!item.launchDate) return "Coming Soon";

		if (mode === "date") {
			const d = new Date(item.launchDate);
			return `Dropping ${String(d.getMonth() + 1).padStart(2, "0")}/${String(
				d.getDate()
			).padStart(2, "0")}`;
		} else {
			// Relative logic
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const dayLaunch = new Date(
				item.launchDate.getFullYear(),
				item.launchDate.getMonth(),
				item.launchDate.getDate()
			);
			const daysDiff = Math.floor(
				(dayLaunch.getTime() - today.getTime()) / 86400000
			);

			if (daysDiff > 0) return `Drops in ${daysDiff}d`;
			if (daysDiff === 0) return "Drops Today";
			if (daysDiff < 0) return "Dropped";
			return "Upcoming";
		}
	};

	const displayItems = hasSelection
		? section
				.collectionIds!.map((id) => collectionsLookup.find((c) => c.id === id))
				.filter(Boolean)
		: Array.from({ length: 3 }).map((_, i) => ({
				id: `mock-${i}`,
				name: `Collection 00${i + 1}`,
				status: `DROPPING 01/15`,
				launchDate: null,
				image: null,
		  }));

	return (
		<section className="relative w-full py-16 px-6 border-b border-dashed border-stroke/20 group bg-bg">
			{/* Label (Hover only) */}
			<div className="absolute top-2 left-2 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] uppercase font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
				Featured Drops ({section.layout})
			</div>

			<div className="max-w-5xl mx-auto space-y-8 md:space-y-10">
				<div className="flex items-end justify-between border-b border-stroke/10 pb-4">
					<div className="space-y-1">
						<h3 className="font-heading text-xl md:text-2xl font-semibold tracking-tight">
							{section.title ?? "Upcoming Drops"}
						</h3>
						<p className="text-xs text-text-muted">
							{section.subtitle ?? "Limited edition releases descending soon."}
						</p>
					</div>
					<div className="hidden md:block text-xs font-medium text-accent uppercase tracking-wider">
						View All
					</div>
				</div>

				{/* Drops Grid/Carousel */}
				<div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
					{displayItems.map((item: any, i: number) => (
						<div
							key={item.id}
							className="flex-shrink-0 w-[260px] h-[360px] group/card cursor-default"
						>
							<div className="w-full h-full bg-surface-2 rounded-sm relative overflow-hidden flex flex-col justify-end p-4">
								{/* Visual Placeholder or Image */}
								{item.image ? (
									<img
										src={item.image}
										alt={item.name}
										className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
									/>
								) : (
									<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 z-10" />
								)}
								{!item.image && (
									<div className="absolute inset-0 flex items-center justify-center text-text-muted/10 opacity-30">
										<Timer className="w-24 h-24" />
									</div>
								)}

								{/* Gradient Overlay for text readability if image exists */}
								<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 z-10" />

								{/* Content Overlay */}
								<div className="relative z-20 space-y-2">
									<div
										className={cn(
											"px-2 py-1 rounded text-[10px] font-bold w-fit bg-white/20 text-white backdrop-blur-md"
										)}
									>
										{getStatusText(item).toUpperCase()}
									</div>
									<div>
										<h4 className="text-lg font-bold text-white leading-tight">
											{item.name}
										</h4>
										{section.cardSubtext !== "" && (
											<p className="text-xs text-white/70">
												{section.cardSubtext ?? "Exclusive access via App"}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
