import { useEffect, useState } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import { useAuth } from "@/lib/auth/AuthContext";
import type {
	AiUsage,
	BgRemovalUsage,
	BrandCredits,
} from "@/lib/models/credits";

const toDate = (v: unknown): Date | null =>
	v instanceof Timestamp ? v.toDate() : null;

export interface UseStudioCreditsReturn {
	/** True until all three sources have answered once. */
	loading: boolean;
	error: string | null;
	messaging: BrandCredits;
	ai: AiUsage | null;
	bgRemoval: BgRemovalUsage | null;
}

/**
 * Realtime view of the three credit allowances, read from the same Firestore
 * documents the mobile app uses.
 */
export function useStudioCredits(): UseStudioCreditsReturn {
	const { user } = useAuth();
	const uid = user?.uid;

	const [messaging, setMessaging] = useState<BrandCredits>({
		balance: 0,
		totalUsed: 0,
		updatedAt: null,
	});
	const [ai, setAi] = useState<AiUsage | null>(null);
	const [bgRemoval, setBgRemoval] = useState<BgRemovalUsage | null>(null);
	const [ready, setReady] = useState({ messaging: false, ai: false, bg: false });
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!uid) return;
		setError(null);
		setReady({ messaging: false, ai: false, bg: false });

		const fail = (e: Error) => setError(e.message || "Failed to load credits");

		const unsubMessaging = onSnapshot(
			doc(db, "brands", uid),
			(snap) => {
				const c = snap.data()?.credits;
				setMessaging({
					balance: Number(c?.balance ?? 0),
					totalUsed: Number(c?.totalUsed ?? 0),
					updatedAt: toDate(c?.updatedAt),
				});
				setReady((r) => ({ ...r, messaging: true }));
			},
			fail,
		);

		// A missing usage doc is normal for a brand that hasn't used the feature
		const unsubAi = onSnapshot(
			doc(db, "users", uid, "usage", "ai_generation"),
			(snap) => {
				const d = snap.data();
				setAi(
					snap.exists() && d
						? {
								count: Number(d.count ?? 0),
								month: String(d.month ?? ""),
								subscriptionTier: String(d.subscriptionTier ?? "free"),
								lastCheckedTier: toDate(d.lastCheckedTier),
							}
						: null,
				);
				setReady((r) => ({ ...r, ai: true }));
			},
			fail,
		);

		const unsubBg = onSnapshot(
			doc(db, "users", uid, "usage", "bg_removal"),
			(snap) => {
				const d = snap.data();
				setBgRemoval(
					snap.exists() && d
						? {
								freeAllowanceGranted: Number(d.freeAllowanceGranted ?? 0),
								freeAllowanceUsed: Number(d.freeAllowanceUsed ?? 0),
								purchasedCredits: Number(d.purchasedCredits ?? 0),
								subscriptionTier: String(d.subscriptionTier ?? ""),
								lastCheckedTier: toDate(d.lastCheckedTier),
							}
						: null,
				);
				setReady((r) => ({ ...r, bg: true }));
			},
			fail,
		);

		return () => {
			unsubMessaging();
			unsubAi();
			unsubBg();
		};
	}, [uid]);

	return {
		loading: !!uid && !(ready.messaging && ready.ai && ready.bg) && !error,
		error,
		messaging,
		ai,
		bgRemoval,
	};
}
