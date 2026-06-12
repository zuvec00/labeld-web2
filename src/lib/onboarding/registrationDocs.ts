import { serverTimestamp } from "firebase/firestore";
import { slugify } from "@/lib/utils";
import type { EventOrganizerOnboardingData } from "@/lib/stores/eventOrganizerStore";

type EventOrganizerRegistrationUrls = {
	logoUrl: string;
	coverImageUrl?: string | null;
};

function nullableText(value: string | null | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

export function buildEventOrganizerRegistrationDoc(
	uid: string,
	data: EventOrganizerOnboardingData,
	urls: EventOrganizerRegistrationUrls,
) {
	const username = slugify(data.username);

	return {
		uid,
		organizerName: data.organizerName.trim(),
		username,
		slug: username,
		logoUrl: urls.logoUrl || "",
		coverImageUrl: urls.coverImageUrl ?? null,
		bio: nullableText(data.bio),
		eventCategory: nullableText(data.eventCategory) ?? "Other",
		baseCity: nullableText(data.baseCity),
		activeSince: nullableText(data.activeSince),
		email: nullableText(data.email),
		phone: nullableText(data.phone),
		instagram: nullableText(data.instagram),
		tiktok: nullableText(data.tiktok),
		twitter: nullableText(data.twitter),
		website: nullableText(data.website),
		subscriptionTier: "free",
		subscriptionStatus: null,
		pricingPlanId: null,
		storefrontConfig: null,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	};
}
