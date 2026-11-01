import type { Template } from "@/lib/models/site-customization";
import { canUseTemplateForPlan } from "@/lib/plans/free-storefront";

/**
 * What the brand can do with a theme right now.
 * - available:      can activate and customise it
 * - needs_pro:      plan upgrade required (included Pro themes, or an owned
 *                   premium theme on a lapsed plan)
 * - needs_purchase: premium theme the brand has not bought
 */
export type ThemeAccess = "available" | "needs_pro" | "needs_purchase";

export function getThemeAccess(
	template: Template,
	isPro: boolean,
	entitledThemeIds: Set<string>
): ThemeAccess {
	if (template.access === "premium") {
		if (!entitledThemeIds.has(template.id)) return "needs_purchase";
		return isPro ? "available" : "needs_pro";
	}
	return canUseTemplateForPlan(template.id, isPro) ? "available" : "needs_pro";
}

/** Mirrors mobile: hide non-live themes unless the brand already owns them. */
export function isThemeListed(
	template: Template,
	entitledThemeIds: Set<string>
): boolean {
	return (
		!template.status ||
		template.status === "live" ||
		entitledThemeIds.has(template.id)
	);
}

/** Pro brands get the Pro price when the theme has one. */
export function getThemePriceMinor(
	template: Template,
	isPro: boolean
): number | null {
	const price =
		isPro && template.proPriceMinor != null
			? template.proPriceMinor
			: template.regularPriceMinor;
	return price ?? null;
}
