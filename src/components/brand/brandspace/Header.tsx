"use client";

import React from "react";
import Button from "@/components/ui/button";
import HeatGlow from "./HeatGlow";
import { getHeatColor } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
}: {
	brandName: string;
	username: string;
	bio?: string | null;
	heat: number;
	followers: number;
	following: number;
	onEdit?: () => void;
	isOwner?: boolean;
}) {
	const heatInt = Math.max(0, Math.floor(Number.isFinite(heat) ? heat : 0));
	const color = getHeatColor(80);
	const router = useRouter();

	return (
		<div className="px-4 sm:px-6">
			<div className="flex items-start justify-between gap-6">
				<div className="min-w-0">
					<h1 className="font-heading font-semibold text-2xl truncate">
						{brandName}
					</h1>
					<p className="text-text-muted">@{username}</p>
				</div>

				{/* Stats row (desktop) */}
				<div className="hidden sm:flex items-center gap-6 shrink-0">
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

			{/* Stats row (mobile) */}
			<div className="sm:hidden mt-4 flex items-center gap-6">
				<Stat
					label="Heat"
					suffix="🔥"
					valueNode={
						<HeatGlow score={heatInt} glowSize={28}>
							<span
								className={`font-heading font-semibold text-lg leading-none text-${color}`}
							>
								{heatInt}
							</span>
						</HeatGlow>
					}
				/>
				<Stat label="Followers" value={followers} />
				<Stat label="Following" value={following} />
			</div>

			{bio ? <p className="mt-3">{bio}</p> : null}

			<div className="mt-4 flex items-center gap-3">
				{isOwner && (
					<Button
						text="Edit profile"
						variant="secondary"
						onClick={() => router.push("/brand-space/profile/edit")}
						className="px-4 py-2"
					/>
				)}
			</div>
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
