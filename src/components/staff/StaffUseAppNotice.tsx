"use client";

import Image from "next/image";
import Button from "@/components/ui/button";
import StaffAppLinks from "@/components/staff/StaffAppLinks";
import { useAuth } from "@/lib/auth/AuthContext";
import type { StaffMembership } from "@/lib/firebase/callables/staffInvite";

/**
 * Shown on the web dashboard to a person who works for a brand as staff and has
 * no brand of their own. Staff work in the Studio app.
 */
export default function StaffUseAppNotice({
	brands,
}: {
	brands: StaffMembership[];
}) {
	const { user, signOutApp } = useAuth();
	const names = brands.map((b) => b.brandName).filter(Boolean);

	return (
		<div className="min-h-dvh bg-bg flex items-center justify-center p-6">
			<div className="max-w-md w-full">
				<div className="flex items-center justify-center gap-2 mb-8">
					<Image src="/labeld_logo.png" alt="Labeld" width={48} height={48} className="h-12 w-12" />
					<span className="font-heading font-semibold text-cta text-xl">LABELD</span>
				</div>
				<div className="bg-surface border border-stroke rounded-2xl p-6 sm:p-8">
					<h1 className="font-heading font-semibold text-xl mb-2 text-center">
						Use the Studio app
					</h1>
					<p className="text-text-muted text-sm text-center mb-6">
						{names.length > 0 ? (
							<>
								You work for <span className="font-medium text-text">{names.join(", ")}</span>.{" "}
							</>
						) : null}
						Your team&apos;s work happens in the Labeld Studio app, not on the web
						dashboard. Open the app and sign in
						{user?.email ? <> with <span className="font-medium text-text">{user.email}</span></> : null}.
					</p>
					<StaffAppLinks />
					<div className="mt-6 text-center">
						<Button variant="outline" text="Sign out" onClick={() => void signOutApp()} />
					</div>
				</div>
			</div>
		</div>
	);
}
