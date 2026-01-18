"use client";

import React from "react";
import {
	Check,
	Palette,
	Layout,
	Type,
	MousePointer,
	ToggleLeft,
} from "lucide-react";

interface CustomizationFeaturesProps {
	isPro: boolean;
}

export default function CustomizationFeatures({
	isPro,
}: CustomizationFeaturesProps) {
	const badges = {
		proOnly: (
			<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stroke text-text-muted border border-stroke/50">
				Pro Only
			</span>
		),
		comingSoon: (
			<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-accent/10 text-accent border border-accent/20">
				Coming Soon
			</span>
		),
	};

	const items = [
		{
			icon: <Palette className="w-4 h-4" />,
			title: "Brand Colors",
			desc: "Apply your exact brand hex codes to buttons, accents, and highlights.",
			comingSoon: false,
		},
		{
			icon: <Layout className="w-4 h-4" />,
			title: "Section Order",
			desc: "Drag and drop homepage sections to tell your specific story.",
			comingSoon: false,
		},
		{
			icon: <ToggleLeft className="w-4 h-4" />,
			title: "Section Visibility",
			desc: "Toggle hero sections, featured drops, and collection lists on or off.",
			comingSoon: false,
		},
		{
			icon: <Type className="w-4 h-4" />,
			title: "Typography",
			desc: "Choose from curated font pairings to give your brand a distinct voice.",
			comingSoon: true,
		},
		{
			icon: <MousePointer className="w-4 h-4" />,
			title: "Navigation Style",
			desc: "Control header links and footer menus to guide customer journeys.",
			comingSoon: false,
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-heading font-semibold text-xl mb-1">
					Customization Capabilities
				</h3>
				<p className="text-text-muted text-sm">
					Fine-tune every aspect of your storefront to match your brand
					identity.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{items.map((item, i) => (
					<div
						key={i}
						className="p-4 rounded-xl border border-stroke bg-surface/50 flex gap-4"
					>
						<div className="w-10 h-10 rounded-lg bg-bg border border-stroke flex items-center justify-center flex-shrink-0 text-text-muted">
							{item.icon}
						</div>
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<h4 className="font-medium text-text text-sm">{item.title}</h4>
								{/* Gating Logic: If Free, show "Pro Only". If Pro, show "Coming Soon" only if strictly not ready. */}
								{!isPro
									? badges.proOnly
									: item.comingSoon
									? badges.comingSoon
									: null}
							</div>
							<p className="text-xs text-text-muted leading-relaxed">
								{item.desc}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
