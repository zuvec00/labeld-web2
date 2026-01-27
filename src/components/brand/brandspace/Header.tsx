"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button";
import HeatGlow from "./HeatGlow";
import { getHeatColor } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useBrandOnboardingStatus } from "@/hooks/useBrandOnboardingStatus";
import MaintenanceModal from "@/components/modals/MaintenanceModal";
import {
	Calendar,
	Copy,
	ExternalLink,
	MoreHorizontal,
	Package,
	Settings2,
} from "lucide-react";
import BrandStoreToggle from "@/components/dashboard/BrandStoreToggle";

/* --- Header --- */
export default function BrandHeader({
	brandName,
	username,
	bio,
	heat,
	followers,
	following,
	onEdit,
	isOwner = true,
	joinedAt,
	productCount = 0,
	lastDropDate,
	subscriptionTier,
}: {
	brandName: string;
	username: string;
	bio?: string | null;
	heat: number;
	followers: number;
	following: number;
	onEdit?: () => void;
	isOwner?: boolean;
	joinedAt?: Date;
	productCount?: number;
	lastDropDate?: Date | null;
	subscriptionTier?: "free" | "pro";
}) {
	const heatInt = Math.max(0, Math.floor(Number.isFinite(heat) ? heat : 0));
	const color = getHeatColor(80);
	const router = useRouter();
	const [copied, setCopied] = useState(false);
	const [showMenu, setShowMenu] = useState(false);

	// Onboarding Check
	const { isComplete } = useBrandOnboardingStatus();
	const [showMaintenance, setShowMaintenance] = useState(false);

	const brandWebsiteUrl = `https://shop.labeld.app/${username}`;

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(brandWebsiteUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy link:", err);
		}
	};

	const handleOpenWebsite = () => {
		if (isComplete) {
			window.open(brandWebsiteUrl, "_blank");
		} else {
			setShowMaintenance(true);
		}
	};

	// Logic: Active if last drop < 30 days
	const daysSinceLastDrop = lastDropDate
		? Math.floor(
				(new Date().getTime() - new Date(lastDropDate).getTime()) /
					(1000 * 3600 * 24),
			)
		: 999;
	const isActive = daysSinceLastDrop <= 30;

	// Format Last Drop
	let lastDropLabel = "No drops yet";
	if (lastDropDate) {
		if (daysSinceLastDrop === 0) lastDropLabel = "Last drop today";
		else if (daysSinceLastDrop === 1) lastDropLabel = "Last drop yesterday";
		else lastDropLabel = `Last drop ${daysSinceLastDrop} days ago`;
	}

	// Format joined date
	const joinedDateStr = joinedAt
		? new Date(joinedAt).toLocaleDateString(undefined, {
				month: "long",
				year: "numeric",
			})
		: "";

	return (
		<div className="px-4 sm:px-6">
			<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h1 className="font-heading font-semibold text-2xl truncate">
							{brandName}
						</h1>
						{/* Verified Badge Signal (Commented out per request) */}
						{/* <div className="text-blue-500" title="Verified Brand">
							<BadgeCheck className="w-5 h-5 fill-blue-500/10" />
						</div> */}
					</div>
					<p className="text-text-muted">@{username}</p>

					{/* Context Layer */}
					<div className="flex items-center gap-3 mt-2 text-xs font-medium text-text-muted/80">
						{isActive && (
							<>
								<span className="flex items-center gap-1.5 text-green-500">
									<span className="relative flex h-2 w-2">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
										<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
									</span>
									Active
								</span>
								<span>·</span>
								<span className="text-text">Store Open</span>
								<span>·</span>
							</>
						)}
						{lastDropDate && <span>{lastDropLabel}</span>}
					</div>

					{bio ? (
						<p className="mt-4 max-w-2xl text-sm leading-relaxed">{bio}</p>
					) : null}

					{/* Trust Signals & Meta */}
					<div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
						{joinedDateStr && (
							<div className="flex items-center gap-1.5">
								<Calendar className="w-3.5 h-3.5" />
								<span>Joined {joinedDateStr}</span>
							</div>
						)}
						<div className="flex items-center gap-1.5">
							<Package className="w-3.5 h-3.5" />
							<span>{productCount} Products</span>
						</div>
					</div>
				</div>

				{/* Stats & Edit Action */}
				<div className="flex flex-row-reverse md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0 mt-4 md:mt-0 w-full md:w-auto">
					<div className="flex items-center gap-2">
						{isOwner && subscriptionTier !== "pro" && (
							<button
								onClick={() => router.push("/pricing")}
								className="px-3 py-1.5 bg-cta text-text text-sm font-semibold rounded-lg hover:bg-cta/90 transition-colors shadow-sm"
							>
								Upgrade
							</button>
						)}
						{isOwner && (
							<button
								onClick={() => router.push("/brand-space/profile/edit")}
								className="p-2 rounded-full text-text-muted hover:text-text hover:bg-surface transition-colors"
								title="Edit Profile"
							>
								<Settings2 className="w-5 h-5" />
							</button>
						)}
					</div>

					<div className="flex items-center gap-6">
						<Stat
							label="Heat"
							suffix="🔥"
							valueNode={
								<HeatGlow score={heatInt} glowSize={32}>
									<span
										className={`font-heading font-semibold text-lg leading-none `}
									>
										{heatInt}
									</span>
								</HeatGlow>
							}
						/>
						<Stat label="Followers" value={followers} />
						<Stat label="Following" value={following} />
					</div>
				</div>
			</div>

			{/* Action Hierarchy - Refined */}
			<div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-t border-stroke pt-4">
				{/* Wrapper for Status + Menu */}
				<div className="flex flex-row items-center justify-between w-full sm:contents gap-4">
					{/* Store Status Toggle */}
					{isOwner && (
						<div className="flex justify-start sm:flex-1 sm:justify-start">
							<BrandStoreToggle />
						</div>
					)}

					{/* More Actions Menu */}
					<div className="relative ml-auto">
						<button
							onClick={() => setShowMenu(!showMenu)}
							className="p-2.5 rounded-lg border border-stroke hover:bg-surface text-text-muted hover:text-text transition-colors"
							title="More Actions"
						>
							<MoreHorizontal className="w-5 h-5" />
						</button>

						{showMenu && (
							<>
								<div
									className="fixed inset-0 z-10"
									onClick={() => setShowMenu(false)}
								/>
								<div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-stroke rounded-xl shadow-xl z-20 overflow-hidden p-1 flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top-right">
									<button
										onClick={() => {
											handleOpenWebsite();
											setShowMenu(false);
										}}
										className="w-full text-left px-3 py-2 text-sm hover:bg-stroke/10 rounded-lg flex items-center gap-2 text-text"
									>
										<ExternalLink className="w-4 h-4 text-text-muted" />
										Open Store
									</button>
									<button
										onClick={() => {
											handleCopyLink();
											setShowMenu(false);
										}}
										className="w-full text-left px-3 py-2 text-sm hover:bg-stroke/10 rounded-lg flex items-center gap-2 text-text"
									>
										<Copy className="w-4 h-4 text-text-muted" />
										{copied ? "Copied Link" : "Copy Store Link"}
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			</div>

			<MaintenanceModal
				isOpen={showMaintenance}
				onClose={() => setShowMaintenance(false)}
			/>
		</div>
	);
}

/* --- Stat: same layout; supports custom value node for Heat --- */
function Stat({
	label,
	value,
	suffix,
	valueNode,
}: {
	label: string;
	value?: number;
	suffix?: string;
	valueNode?: React.ReactNode; // used for Heat glow; others still pass `value`
}) {
	return (
		<div className="text-center">
			<div className="font-heading font-semibold text-lg leading-none">
				{valueNode ?? value}
			</div>
			<div className="text-text-muted text-md">
				{label}
				{suffix ? ` ${suffix}` : ""}
			</div>
		</div>
	);
}
