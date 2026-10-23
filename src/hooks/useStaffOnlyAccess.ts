"use client";

import { useEffect, useState } from "react";
import {
	getMyBrandAccessCF,
	type StaffMembership,
} from "@/lib/firebase/callables/staffInvite";

interface StaffOnlyState {
	checking: boolean;
	isStaffOnly: boolean;
	brands: StaffMembership[];
}

const LOOKUP_TIMEOUT_MS = 8000;

/**
 * Staff do their work in the Studio app. This tells the web dashboard whether
 * the signed-in person has no brand or organizer of their own but works for a
 * brand, so it can show "use the app" instead of onboarding them into a brand
 * they never meant to create.
 *
 * Pass `enabled` only when the person has no brand or organizer of their own,
 * so owners never trigger the lookup. A failed or slow lookup counts as "not
 * staff": nobody is ever blocked by it.
 */
export function useStaffOnlyAccess(enabled: boolean): StaffOnlyState {
	const [state, setState] = useState<StaffOnlyState>({
		checking: false,
		isStaffOnly: false,
		brands: [],
	});

	useEffect(() => {
		if (!enabled) {
			setState({ checking: false, isStaffOnly: false, brands: [] });
			return;
		}
		let cancelled = false;
		setState((s) => ({ ...s, checking: true }));

		const timeout = new Promise<null>((resolve) =>
			setTimeout(() => resolve(null), LOOKUP_TIMEOUT_MS)
		);
		Promise.race([getMyBrandAccessCF(), timeout]).then((access) => {
			if (cancelled) return;
			const brands = (access?.memberships ?? []).filter(
				(m) => m.state === "active"
			);
			setState({ checking: false, isStaffOnly: brands.length > 0, brands });
		});

		return () => {
			cancelled = true;
		};
	}, [enabled]);

	return state;
}
