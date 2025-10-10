/* eslint-disable @next/next/no-img-element */
/**
 * OptimizedImage Component
 * Intelligently handles image optimization for both Cloudinary and Firebase URLs
 * Uses Next.js Image with appropriate loaders and transformations
 */

import Image from "next/image";
import { useState } from "react";
import {
	cloudinaryLoader,
	isCloudinaryUrl,
	getResponsiveSizes,
} from "@/lib/image/cloudinaryLoader";

export interface OptimizedImageProps {
	src: string;
	alt: string;
	className?: string;
	// Layout props
	width?: number;
	height?: number;
	fill?: boolean;
	// Image behavior
	priority?: boolean;
	loading?: "lazy" | "eager";
	quality?: number;
	// Sizing context (for automatic responsive sizes)
	sizeContext?: "thumbnail" | "card" | "hero" | "full" | "gallery";
	sizes?: string; // Manual override for sizes
	// Additional props
	draggable?: boolean;
	onClick?: () => void;
	onLoad?: () => void;
	onError?: () => void;
	// Object fit
	objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
	objectPosition?: string;
	// Style
	style?: React.CSSProperties;
}

/**
 * OptimizedImage - A smart image component that:
 * - Optimizes Cloudinary URLs with transformations
 * - Uses Next.js Image for Firebase URLs
 * - Maintains visual parity with <img> tags
 * - Provides responsive optimization
 */
export default function OptimizedImage({
	src,
	alt,
	className = "",
	width,
	height,
	fill = false,
	priority = false,
	loading = "lazy",
	quality = 85,
	sizeContext = "card",
	sizes,
	draggable = false,
	onClick,
	onLoad,
	onError,
	objectFit = "cover",
	objectPosition = "center",
	style,
}: OptimizedImageProps) {
	const [imgError, setImgError] = useState(false);

	// Handle image load error
	const handleError = () => {
		setImgError(true);
		onError?.();
	};

	// Fallback for broken images
	if (imgError) {
		return (
			<div
				className={`bg-stroke/20 grid place-items-center ${className}`}
				style={style}
			>
				<span className="text-text-muted text-xs">Image unavailable</span>
			</div>
		);
	}

	// If no src, show placeholder
	if (!src) {
		return (
			<div
				className={`bg-stroke/20 grid place-items-center ${className}`}
				style={style}
			>
				<span className="text-text-muted text-xs">No image</span>
			</div>
		);
	}

	const isCloudinary = isCloudinaryUrl(src);

	// Determine sizes attribute
	const sizesAttr = sizes || getResponsiveSizes(sizeContext);

	// Build style object for object-fit
	const imageStyle: React.CSSProperties = {
		objectFit,
		objectPosition,
		...style,
	};

	// For Cloudinary URLs, use custom loader
	if (isCloudinary) {
		if (fill) {
			// Fill mode - image fills the container
			return (
				<Image
					src={src}
					alt={alt}
					fill
					className={className}
					style={imageStyle}
					loader={({ src, width, quality: q }) =>
						cloudinaryLoader({ src, width, quality: q || quality })
					}
					sizes={sizesAttr}
					priority={priority}
					quality={quality}
					draggable={draggable}
					onClick={onClick}
					onLoad={onLoad}
					onError={handleError}
				/>
			);
		}

		// Fixed dimensions mode
		if (width && height) {
			return (
				<Image
					src={src}
					alt={alt}
					width={width}
					height={height}
					className={className}
					style={imageStyle}
					loader={({ src, width: w, quality: q }) =>
						cloudinaryLoader({ src, width: w, quality: q || quality })
					}
					sizes={sizesAttr}
					priority={priority}
					quality={quality}
					loading={priority ? undefined : loading}
					draggable={draggable}
					onClick={onClick}
					onLoad={onLoad}
					onError={handleError}
				/>
			);
		}

		// Responsive mode - use fill with container
		return (
			<div className={`relative ${className}`} style={style}>
				<Image
					src={src}
					alt={alt}
					fill
					style={{ objectFit, objectPosition }}
					loader={({ src, width, quality: q }) =>
						cloudinaryLoader({ src, width, quality: q || quality })
					}
					sizes={sizesAttr}
					priority={priority}
					quality={quality}
					draggable={draggable}
					onClick={onClick}
					onLoad={onLoad}
					onError={handleError}
				/>
			</div>
		);
	}

	// For Firebase URLs (or other external URLs), use standard Next.js Image
	if (fill) {
		return (
			<Image
				src={src}
				alt={alt}
				fill
				className={className}
				style={imageStyle}
				sizes={sizesAttr}
				priority={priority}
				quality={quality}
				draggable={draggable}
				onClick={onClick}
				onLoad={onLoad}
				onError={handleError}
			/>
		);
	}

	if (width && height) {
		return (
			<Image
				src={src}
				alt={alt}
				width={width}
				height={height}
				className={className}
				style={imageStyle}
				sizes={sizesAttr}
				priority={priority}
				quality={quality}
				loading={priority ? undefined : loading}
				draggable={draggable}
				onClick={onClick}
				onLoad={onLoad}
				onError={handleError}
			/>
		);
	}

	// Fallback: use regular img tag if Next.js Image can't handle it
	return (
		<img
			src={src}
			alt={alt}
			className={className}
			style={imageStyle}
			loading={loading}
			draggable={draggable}
			onClick={onClick}
			onLoad={onLoad}
			onError={handleError}
		/>
	);
}
