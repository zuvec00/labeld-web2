"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";

type Props = {
	/** Helper copy under the icon (Flutter: text) */
	text: string;
	/** Single image vs “add more” icon (Flutter: singleImage, default true) */
	singleImage?: boolean;
	/** Controlled file value (Flutter: imageProvider state) */
	value: File | null;
	/** Optional existing remote image to show when value is empty (Flutter: onlineImage) */
	onlineImage?: string | null;
	/** Controlled setter */
	onChange: (file: File | null) => void;

	/** Visual overrides to match Flutter props */
	backgroundColor?: string; // e.g. "var(--color-cta)" or "#FF5E2E"
	textColor?: string;
	borderRadius?: number; // px
	paddingY?: number; // px
	paddingX?: number; // px
};

export default function UploadImage({
	text,
	singleImage = true,
	value,
	onlineImage = null,
	onChange,
	backgroundColor, // used to tint bg/border like Flutter
	textColor,
	borderRadius = 12,
	paddingY = 14,
	paddingX = 16,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragOver, setDragOver] = useState(false);

	// preview url from File
	const preview = useMemo(() => {
		try {
			return value && value instanceof File ? URL.createObjectURL(value) : null;
		} catch (error) {
			console.warn("Failed to create object URL:", error);
			return null;
		}
	}, [value]);

	// token fallbacks = CTA like your Flutter defaults
	const tint = backgroundColor ?? "var(--color-cta)";
	const labelColor = textColor ?? "var(--color-text-muted)";

	const openFile = () => inputRef.current?.click();

	return (
		<div>
			<div
				role="button"
				tabIndex={0}
				onClick={openFile}
				onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openFile()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragOver(false);
					const f = e.dataTransfer.files?.[0];
					if (f) onChange(f);
				}}
				className={[
					"cursor-pointer border-2 border-dashed",
					"bg-surface rounded-2xl",
					dragOver ? "border-accent bg-surface/60" : "",
				].join(" ")}
				style={{
					// replicate Flutter: dotted border tinted with CTA 20%, bg with CTA 5%
					borderColor: dragOver
						? "var(--color-accent)"
						: hexWithOpacity(tint, 0.2),
					backgroundColor: dragOver
						? "rgba(0,0,0,0)"
						: hexWithOpacity(tint, 0.05),
					borderRadius,
					padding: `${paddingY}px ${paddingX}px`,
				}}
			>
				{/* Top icon + helper text */}
				{!preview && !(onlineImage && onlineImage.length > 0) && (
					<div className="flex flex-col items-center text-center py-6">
						{/* simple inline SVGs so we can tint like Flutter */}
						{singleImage ? (
							<GalleryExportSVG style={{ height: 24, color: tint }} />
						) : (
							<GalleryAddSVG
								style={{ height: 24, color: "var(--color-calm-2)" }}
							/>
						)}
						<div className="h-2" />
						<p
							className="text-sm"
							style={{ color: labelColor, fontWeight: 400 }}
						>
							{text}
						</p>
					</div>
				)}

				{/* Selected local preview OR fallback to online thumbnail */}
				{(preview || (onlineImage && onlineImage.length > 0)) && (
					<div className="pt-2">
						<div className="mx-auto" style={{ width: 88 }}>
							<div
								className="h-px"
								style={{
									backgroundColor: hexWithOpacity(
										"var(--color-text-muted)",
										0.35
									),
								}}
							/>
						</div>

						<div className="mt-2 flex items-center gap-2">
							<div
								className="relative overflow-hidden rounded-lg"
								style={{ width: 40, height: 40 }}
							>
								{preview ? (
									<Image
										src={preview}
										alt="Selected"
										fill
										className="object-cover"
									/>
								) : (
									<Image
										src={onlineImage as string}
										alt="Current"
										fill
										className="object-cover"
									/>
								)}
							</div>
							{/* Optional: small remove/reset action */}
							{preview && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										onChange(null);
									}}
									className="ml-auto text-xs underline text-text-muted hover:text-text"
								>
									Remove
								</button>
							)}
						</div>
					</div>
				)}

				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={(e) => onChange(e.target.files?.[0] || null)}
				/>
			</div>
		</div>
	);
}

/* ------- Small inline SVGs so we can tint via currentColor like Flutter’s ColorFilter ------- */

function GalleryExportSVG(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" {...props} fill="currentColor" aria-hidden="true">
			<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h7A2.5 2.5 0 0 1 16 5.5V7h-2V5.5a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5H13l-1.5 2H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" />
			<path d="M10 15.5 13 12l3 3.5 2-2.5 4 5H8l2-2.5Z" />
		</svg>
	);
}

function GalleryAddSVG(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" {...props} fill="currentColor" aria-hidden="true">
			<path d="M5 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H5Zm7 3h2v3h3v2h-3v3h-2v-3H9V10h3V7Z" />
		</svg>
	);
}

/* ------- helpers ------- */

/**
 * Accepts CSS color (hex or var). If it's a CSS variable,
 * we fallback to simple rgba overlay by returning the var directly
 * (browsers can’t alpha var() easily). For design tokens we pass rgba via overlay anyway.
 */
function hexWithOpacity(color: string, alpha: number) {
	// if CSS var, use currentColor overlay via rgba() trick
	if (color.startsWith("var(")) {
		// use a neutral with opacity; the underlying surface already matches your palette
		return `color-mix(in oklab, ${color} ${Math.round(
			alpha * 100
		)}%, transparent)`;
	}
	// normalize hex => rgba
	const hex = color.replace("#", "");
	const bigint = parseInt(hex, 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
