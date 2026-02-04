import {
	getFirestore,
	doc,
	getDoc,
	onSnapshot,
	Unsubscribe,
	setDoc,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { getApp } from "firebase/app";
import { EventOrganizerModel } from "@/lib/models/eventOrganizer";

const db = getFirestore(getApp());

/**
 * Watch the current user's Event Organizer document in realtime.
 */
export function watchEventOrganizerDoc(
	uid: string,
	onNext: (data: EventOrganizerModel | null) => void
): Unsubscribe {
	const ref = doc(db, "eventOrganizers", uid);
	return onSnapshot(
		ref,
		(snap) => {
			if (!snap.exists()) {
				onNext(null);
				return;
			}
			// Cast data to model
			const data = snap.data();
			onNext({ uid: snap.id, ...data } as EventOrganizerModel);
		},
		(error) => {
			console.error("Error watching event organizer doc:", error);
			onNext(null);
		}
	);
}

/**
 * Fetch the organizer doc once (useful for serverside or initial load).
 */
export async function fetchEventOrganizerDoc(
	uid: string
): Promise<EventOrganizerModel | null> {
	const ref = doc(db, "eventOrganizers", uid);
	const snap = await getDoc(ref);
	if (!snap.exists()) return null;
	return { uid: snap.id, ...snap.data() } as EventOrganizerModel;
}

/**
 * Update the storefront configuration for an event organizer.
 * Merges with existing config.
 */
export async function updateEventStorefrontConfig(
	uid: string,
	configUpdates: Partial<EventOrganizerModel["storefrontConfig"]>
): Promise<void> {
	const ref = doc(db, "eventOrganizers", uid);

	// We use dot notation to update nested fields without overwriting the whole object
	// However, since storefrontConfig might be undefined, we need to be careful.
	// A simpler safe approach for "foundation" is to use setDoc with merge: true
	// or just updateDoc if we are sure the doc exists.
	// For "storefrontConfig.themeId", updateDoc works best if we map it to dot notation.

	const updatePayload: Record<string, any> = {
		updatedAt: serverTimestamp(),
	};

	// Flatten config updates to dot notation
	if (configUpdates) {
		Object.entries(configUpdates).forEach(([key, value]) => {
			updatePayload[`storefrontConfig.${key}`] = value;
		});
	}

	await updateDoc(ref, updatePayload);
}
