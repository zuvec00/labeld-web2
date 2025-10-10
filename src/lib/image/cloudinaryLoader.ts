/**
 * Cloudinary Image Loader for Next.js Image Optimization
 * Injects transformation parameters into Cloudinary URLs for optimal delivery
 */

interface CloudinaryLoaderParams {
	src: string;
	width?: number;
	quality?: number;
}

/**
 * Detects if a URL is from Cloudinary
 */
export function isCloudinaryUrl(src: string): boolean {
	return src.includes("res.cloudinary.com");
}

/**
 * Detects if a URL is from Firebase Storage
 */
export function isFirebaseUrl(src: string): boolean {
	return (
		src.includes("firebasestorage.googleapis.com") ||
		src.includes("firebase.google.com")
	);
}

/**
 * Injects Cloudinary transformations into the URL
 * Adds: automatic format, quality, and width optimizations
 */
export function cloudinaryLoader({
	src,
	width,
	quality,
}: CloudinaryLoaderParams): string {
	// If not a Cloudinary URL, return as-is
	if (!isCloudinaryUrl(src)) {
		return src;
	}

	// Build transformation string
	const transformations: string[] = [
		"f_auto", // Auto format (WebP/AVIF when supported)
		quality ? `q_${quality}` : "q_auto", // Auto quality or specific
		"c_limit", // Limit to specified dimensions (don't upscale)
	];

	// Add width if specified
	if (width && width > 0) {
		transformations.push(`w_${Math.round(width)}`);
	}

	const transformString = transformations.join(",");

	// Insert transformations after '/upload/'
	// Handle both versioned (v1234) and non-versioned URLs
	if (src.includes("/upload/v")) {
		// Has version: .../upload/v1234/folder/file.jpg
		return src.replace("/upload/v", `/upload/${transformString}/v`);
	} else if (src.includes("/upload/")) {
		// No version: .../upload/folder/file.jpg
		return src.replace("/upload/", `/upload/${transformString}/`);
	}

	// Fallback: return original if pattern doesn't match
	return src;
}

/**
 * Gets appropriate sizes attribute based on layout context
 */
export function getResponsiveSizes(context: "thumbnail" | "card" | "hero" | "full" | "gallery"): string {
	switch (context) {
		case "thumbnail":
			return "(max-width: 640px) 60px, (max-width: 1024px) 80px, 100px";
		case "card":
			return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
		case "gallery":
			return "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";
		case "hero":
			return "100vw";
		case "full":
			return "(max-width: 1280px) 100vw, 1280px";
		default:
			return "100vw";
	}
}

