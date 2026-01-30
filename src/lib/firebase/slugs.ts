import { db } from "@/lib/firebase/firebaseConfig";
import {
	doc,
	getDoc,
	setDoc,
	writeBatch,
	serverTimestamp,
	Timestamp,
	runTransaction,
} from "firebase/firestore";

export type SlugType = "brand" | "experience";

export interface PublicSlug {
	slug: string;
	type: SlugType;
	refId: string;
	status: "active" | "disabled";
	updatedAt: Timestamp | null;
	createdAt?: Timestamp | null;
	createdBy?: string;
}

/**
 * Checks if a slug is already taken in the publicSlugs registry.
 * Returns true if taken, false if available.
 */
export async function isPublicSlugTaken(slug: string): Promise<boolean> {
	if (!slug) return false;
	const normalizedSlug = slug.toLowerCase();
	const ref = doc(db, "publicSlugs", normalizedSlug);
	const snap = await getDoc(ref);
	return snap.exists();
}

/**
 * Reserves a slug in the publicSlugs registry.
 * Fails if the slug already exists.
 */
export async function reserveSlug(
	slug: string,
	type: SlugType,
	refId: string,
	uid?: string, // The user performing the action (creator)
): Promise<void> {
	const normalizedSlug = slug.toLowerCase();
	const ref = doc(db, "publicSlugs", normalizedSlug);

	// We use runTransaction to ensure we don't overwrite an existing slug race-condition style,
	// keeping it strict. Although setDoc with merge: false is also safe if we check existance,
	// but a transaction is best for "check then set".
	await runTransaction(db, async (transaction) => {
		const snap = await transaction.get(ref);
		if (snap.exists()) {
			throw new Error(`Slug "${normalizedSlug}" is already taken.`);
		}

		transaction.set(ref, {
			slug: normalizedSlug,
			type,
			refId,
			status: "active",
			updatedAt: serverTimestamp(),
			createdAt: serverTimestamp(),
			createdBy: uid ?? null,
		});
	});
}

/**
 * Updates a slug by deleting the old one and creating the new one.
 * Uses a batch (or transaction) to ensure atomicity.
 */
export async function updateSlug(
	oldSlug: string,
	newSlug: string,
	type: SlugType,
	refId: string,
	uid?: string,
): Promise<void> {
	const normalizedOld = oldSlug.toLowerCase();
	const normalizedNew = newSlug.toLowerCase();

	if (normalizedOld === normalizedNew) return; // No change

	await runTransaction(db, async (transaction) => {
		// 1. Check if new slug is free
		const newRef = doc(db, "publicSlugs", normalizedNew);
		const newSnap = await transaction.get(newRef);
		if (newSnap.exists()) {
			throw new Error(`Slug "${normalizedNew}" is already taken.`);
		}

		// 2. Delete old slug
		const oldRef = doc(db, "publicSlugs", normalizedOld);
		// Optional: Check if old slug exists and belongs to this refId?
		// For now, we trust the caller knows what they are doing, but we could add a check.
		const oldSnap = await transaction.get(oldRef);
		if (oldSnap.exists()) {
			const data = oldSnap.data() as PublicSlug;
			if (data.refId !== refId) {
				// Safety check: Don't delete someone else's slug!
				throw new Error("Old slug belongs to a different resource.");
			}
			transaction.delete(oldRef);
		}

		// 3. Create new slug
		transaction.set(newRef, {
			slug: normalizedNew,
			type,
			refId,
			status: "active",
			updatedAt: serverTimestamp(),
			createdAt: oldSnap.exists()
				? (oldSnap.data()?.createdAt ?? serverTimestamp())
				: serverTimestamp(),
			createdBy: uid ?? null,
		});
	});
}
