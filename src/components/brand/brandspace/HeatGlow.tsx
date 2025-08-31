"use client";

import { getHeatColor } from "@/lib/utils";
import React from "react";

type Props = {
	score: number;
	glowSize?: number; // px radius of glow (visual only)
	children: React.ReactNode; // what to glow (e.g., the heat number)
	className?: string;
};

export default function HeatGlow({
	score,
	glowSize = 32,
	children,
	className,
}: Props) {
	// thresholds like Flutter
	const hasGlow = score >= 30;
	const animated = score >= 60;
	const fast = score >= 80;

	const color = getHeatColor(score);
	const blur = glowSize; // blurRadius
	const spread = glowSize * 0.3; // spreadRadius
	const baseOpacity = fast ? 0.7 : animated ? 0.5 : 0.3;

	const boxShadow = `0 0 ${blur}px ${spread}px ${hexToRgba(
		color,
		baseOpacity
	)}`;

	const durationMs = fast ? 600 : 1400;

	return (
		<span
			className={[
				"relative inline-flex items-center justify-center",
				className || "",
			].join(" ")}
		>
			{hasGlow && (
				<span
					aria-hidden
					className="absolute inset-0 -z-10 rounded-full"
					style={{
						// Use box-shadow for a soft halo; rounded-full keeps it circular
						boxShadow,
						opacity: animated ? 0.8 : 1,
						transform: animated ? "scale(1)" : undefined,
						animation: animated
							? `heatPulse ${durationMs}ms ease-in-out infinite alternate`
							: undefined,
					}}
				/>
			)}
			{children}

			{/* local keyframes; keeps the API self-contained */}
			<style jsx>{`
				@keyframes heatPulse {
					from {
						transform: scale(0.95);
						opacity: 0.75;
					}
					to {
						transform: scale(1.08);
						opacity: 1;
					}
				}
			`}</style>
		</span>
	);
}

// Utility: convert hex to rgba with alpha
function hexToRgba(hex: string, alpha = 1): string {
	const h = hex.replace("#", "");
	const bigint = parseInt(
		h.length === 3
			? h
					.split("")
					.map((c) => c + c)
					.join("")
			: h,
		16
	);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
