export interface StorefrontUrlSource {
	brandSlug?: string | null;
	/** `brandUsername` on the dashboard role context, `username` on the brand doc. */
	brandUsername?: string | null;
	username?: string | null;
	uid?: string | null;
	customDomain?: string | null;
	useCustomDomain?: boolean | null;
	customDomainStatus?: string | null;
}

/**
 * The host the storefront actually serves on: a live custom domain, else
 * `{brandSlug || username || uid}.labeld.app`. Returns null when nothing is
 * known yet (e.g. the profile is still loading).
 *
 * Mirrors `preferredStorefrontUrl` in the mobile BrandModel, which in turn
 * mirrors `brandPreferredUrl` in the storefront repo. That is the canonical URL
 * the storefront advertises, and Google Search Console verifies an exact URL
 * prefix, so every place we show the store address must agree with it.
 */
export function getPreferredStorefrontHost(
	src: StorefrontUrlSource | null | undefined,
): string | null {
	if (!src) return null;
	if (
		src.useCustomDomain === true &&
		src.customDomain &&
		src.customDomainStatus === "active"
	) {
		return src.customDomain;
	}
	const slug = src.brandSlug || src.brandUsername || src.username || src.uid;
	return slug ? `${slug}.labeld.app` : null;
}

/** `https://…` form of {@link getPreferredStorefrontHost}. */
export function getPreferredStorefrontUrl(
	src: StorefrontUrlSource | null | undefined,
): string | null {
	const host = getPreferredStorefrontHost(src);
	return host ? `https://${host}` : null;
}
