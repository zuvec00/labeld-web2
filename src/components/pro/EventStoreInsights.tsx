"use client";

import {
	Ticket,
	ShoppingBag,
	ArrowRight,
	ArrowLeftRight,
	Sparkles,
} from "lucide-react";

export default function EventStoreInsights({
	isPro = true,
}: {
	isPro?: boolean;
}) {
	if (!isPro) return null;

	return (
		<div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 relative overflow-hidden">
			{/* Background decoration */}
			<div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
				<ArrowLeftRight className="w-32 h-32" />
			</div>

			<div className="flex items-start justify-between mb-6 relative z-10">
				<div>
					<div className="flex items-center gap-2 mb-1">
						<h3 className="font-heading font-semibold text-lg text-text">
							Event ↔ Store Ecosystem
						</h3>
						<span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wide">
							Coming Soon
						</span>
					</div>
					<p className="text-sm text-text-muted">
						Unlocking the power of your connected brand ecosystem
					</p>
				</div>
				<div className="p-2 bg-blue-500/10 rounded-lg">
					<Sparkles className="w-5 h-5 text-blue-500" />
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
				{/* Insight 1 */}
				<div className="bg-surface/80 backdrop-blur-sm p-4 rounded-lg border border-stroke/50">
					<div className="flex items-center gap-2 mb-3 text-xs font-medium text-text-muted uppercase tracking-wide">
						<Ticket className="w-3 h-3" />
						<ArrowRight className="w-3 h-3" />
						<ShoppingBag className="w-3 h-3" />
					</div>
					<div className="font-medium text-text mb-1">
						Ticket Buyer Conversion
					</div>
					<p className="text-sm text-text-muted">
						See how many attendees of{" "}
						<span className="text-text font-medium">Summer Rave</span> bought
						merch afterwards.
					</p>
					<div className="mt-3 h-2 w-full bg-stroke/30 rounded-full overflow-hidden">
						<div className="h-full w-2/3 bg-blue-500/30 animate-pulse" />
					</div>
				</div>

				{/* Insight 2 */}
				<div className="bg-surface/80 backdrop-blur-sm p-4 rounded-lg border border-stroke/50">
					<div className="flex items-center gap-2 mb-3 text-xs font-medium text-text-muted uppercase tracking-wide">
						<ShoppingBag className="w-3 h-3" />
						<ArrowRight className="w-3 h-3" />
						<Ticket className="w-3 h-3" />
					</div>
					<div className="font-medium text-text mb-1">
						Merch-Driven Attendance
					</div>
					<p className="text-sm text-text-muted">
						Track customers who scanned physical products to buy event tickets.
					</p>
					<div className="mt-3 h-2 w-full bg-stroke/30 rounded-full overflow-hidden">
						<div className="h-full w-1/3 bg-purple-500/30 animate-pulse" />
					</div>
				</div>
			</div>

			<div className="mt-4 pt-4 border-t border-blue-500/10 flex items-center justify-between text-xs text-text-muted relative z-10">
				<p>This cross-platform intelligence is unique to Labeld.</p>
				<div className="font-medium text-blue-600">
					Included in your Pro plan
				</div>
			</div>
		</div>
	);
}
