"use client";

import AppleIcon from "@/components/ui/AppleIcon";
import GooglePlayIcon from "@/components/ui/GooglePlayIcon";

export const STUDIO_IOS_URL = "https://apps.apple.com/ng/app/labeld-studio/id6760316742";
export const STUDIO_ANDROID_URL =
	"https://play.google.com/store/apps/details?id=com.labeld.labeldStudio";

/** Opens the Studio app on a phone that has it installed (custom scheme). */
export const STUDIO_APP_URL = "labeld://studio";

function isPhone(): boolean {
	if (typeof navigator === "undefined") return false;
	return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Store links for the Studio app, plus an "Open the app" link on phones. Staff
 * work in the app, so this is where we send them after joining.
 */
export default function StaffAppLinks() {
	return (
		<div className="space-y-3">
			{isPhone() && (
				<a
					href={STUDIO_APP_URL}
					className="flex w-full items-center justify-center rounded-xl bg-cta px-4 py-3 text-sm font-medium text-white hover:opacity-90"
				>
					Open the Studio app
				</a>
			)}
			<div className="grid grid-cols-2 gap-3">
				<a
					href={STUDIO_IOS_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center justify-center gap-2 rounded-xl border border-stroke px-4 py-3 hover:bg-stroke/20 transition-colors"
				>
					<AppleIcon className="w-5 h-5" />
					<span className="text-sm font-medium">App Store</span>
				</a>
				<a
					href={STUDIO_ANDROID_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center justify-center gap-2 rounded-xl border border-stroke px-4 py-3 hover:bg-stroke/20 transition-colors"
				>
					<GooglePlayIcon className="w-5 h-5" />
					<span className="text-sm font-medium">Google Play</span>
				</a>
			</div>
		</div>
	);
}
