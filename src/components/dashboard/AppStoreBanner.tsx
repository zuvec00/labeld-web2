"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import AppleIcon from "@/components/ui/AppleIcon";
import GooglePlayIcon from "@/components/ui/GooglePlayIcon";
import { STUDIO_ANDROID_URL, STUDIO_IOS_URL } from "@/lib/appLinks";

const BANNER_STORAGE_KEY = "labeld-sidebar-app-promo-dismissed-v2";

interface AppStoreBannerProps {
	role?: "brand" | "eventOrganizer" | "all";
}

export default function AppStoreBanner({ role = "all" }: AppStoreBannerProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const isDismissed = localStorage.getItem(BANNER_STORAGE_KEY);
		if (!isDismissed) {
			setIsVisible(true);
		}
	}, []);

	const handleDismiss = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		localStorage.setItem(BANNER_STORAGE_KEY, "true");
		setIsVisible(false);
	};

	if (!isVisible) return null;

	const content = {
		brand: {
			title: "Brand Management",
			description: "Manage your brand, track sales, and grow your community on the go.",
		},
		eventOrganizer: {
			title: "Event Tools",
			description: "Scan tickets, manage event access, and track revenue on the go.",
		},
		all: {
			title: "Labeld Studio",
			description: "Manage your brand, scan tickets, and track sales on the go.",
		},
	};

	const { title, description } = content[role] || content.all;

	return (
		<div className="px-3 mb-4 mt-2">
			<div className="relative group overflow-hidden rounded-2xl bg-surface-elevated border border-stroke p-4 transition-all hover:border-accent/30 shadow-sm">
				{/* Background Glow */}
				<div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-all" />
				
				<button 
					onClick={handleDismiss}
					className="absolute top-2 right-2 p-1 text-text-muted hover:text-text rounded-lg hover:bg-stroke/50 transition-colors z-10"
					aria-label="Dismiss"
				>
					<X className="w-4 h-4" />
				</button>

				<div className="flex flex-col gap-3 relative z-0">
					<div className="flex items-center gap-3">
						<div className="bg-bg p-2 rounded-xl border border-stroke shadow-inner">
							<Image src="/1.svg" alt="Labeld" width={24} height={24} className="w-6 h-6" />
						</div>
						<div className="flex flex-col">
							<span className="text-sm font-semibold text-text">{title}</span>
							<span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Mobile App</span>
						</div>
					</div>

					<p className="text-xs text-text-muted leading-relaxed">
						{description}
					</p>

					<div className="grid grid-cols-2 gap-2">
						<a
							href={STUDIO_IOS_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-text text-bg text-[11px] font-bold hover:opacity-90 transition-all"
						>
							<AppleIcon className="w-3.5 h-3.5" />
							APP STORE
						</a>
						<a
							href={STUDIO_ANDROID_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-text text-bg text-[11px] font-bold hover:opacity-90 transition-all"
						>
							<GooglePlayIcon className="w-3.5 h-3.5" />
							GOOGLE PLAY
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
