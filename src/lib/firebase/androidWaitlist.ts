import {
	addDoc,
	collection,
	getDocs,
	limit,
	query,
	serverTimestamp,
	where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";

const COLLECTION = "studio_android_waitlist";

export type AndroidWaitlistInput = {
	email: string;
	name?: string;
	brandName?: string;
	handle?: string;
	country?: string;
};

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

export async function joinAndroidWaitlist(input: AndroidWaitlistInput) {
	const email = normalizeEmail(input.email);
	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw new Error("Enter a valid email address.");
	}

	const existing = await getDocs(
		query(collection(db, COLLECTION), where("email", "==", email), limit(1)),
	);

	if (!existing.empty) {
		return {
			alreadyJoined: true,
			message: "You are already on the Android testing list.",
		};
	}

	await addDoc(collection(db, COLLECTION), {
		email,
		name: input.name?.trim() || null,
		brandName: input.brandName?.trim() || null,
		handle: input.handle?.trim() || null,
		country: input.country?.trim() || null,
		status: "pending",
		source: "studio_android_waitlist_page",
		platform: "android",
		product: "labeld_studio",
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
		addedToTestingAt: null,
		lastEmailedAt: null,
	});

	return {
		alreadyJoined: false,
		message: "You are on the Android testing list.",
	};
}
