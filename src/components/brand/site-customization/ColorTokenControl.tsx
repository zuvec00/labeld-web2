"use client";

import React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorTokenControlProps {
	label: string;
	description?: string;
	value: string;
	onChange: (value: string) => void;
	isPro: boolean;
	onLockedClick?: () => void;
	isRequired?: boolean;
}

export default function ColorTokenControl({
	label,
	description,
	value,
	onChange,
	isPro,
	onLockedClick,
	isRequired = false,
}: ColorTokenControlProps) {
	const handleInteraction = (e: React.MouseEvent) => {
		if (!isPro && onLockedClick) {
			e.preventDefault();
			e.stopPropagation();
			onLockedClick();
		}
	};

	return (
		<div
			className={cn("space-y-3", !isPro && "opacity-75")}
			onClick={handleInteraction}
		>
			<div className="flex justify-between items-baseline">
				<label className="text-sm font-medium text-text flex items-center gap-2">
					{label}
					{!isPro && <Lock className="w-3 h-3 text-text-muted/60" />}
					{isRequired && (
						<span className="text-cta text-[10px] uppercase font-bold">
							Required
						</span>
					)}
				</label>
			</div>

			<div className="flex gap-3 items-center">
				{/* Visual Swatch & Native Picker */}
				<div
					className="relative w-12 h-12 rounded-lg border border-stroke shadow-sm overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
					title={!isPro ? "Upgrade to customize" : "Click to pick color"}
				>
					<div
						className="absolute inset-0"
						style={{ backgroundColor: value }}
					/>
					<input
						type="color"
						value={value}
						onChange={(e) => isPro && onChange(e.target.value)}
						disabled={!isPro}
						className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 border-0"
					/>
				</div>

				{/* Hex Input */}
				<div className="flex-1 relative">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">
						#
					</span>
					<input
						type="text"
						value={value.replace("#", "")}
						onChange={(e) => {
							if (isPro) {
								onChange(`#${e.target.value}`);
							}
						}}
						disabled={!isPro}
						maxLength={6}
						className="w-full h-12 pl-7 pr-4 bg-surface border border-stroke rounded-lg text-sm font-mono focus:border-text focus:ring-0 transition-colors uppercase placeholder:text-text-muted/30"
						placeholder="000000"
					/>
				</div>
			</div>

			{description && (
				<p className="text-xs text-text-muted leading-relaxed">{description}</p>
			)}
		</div>
	);
}
