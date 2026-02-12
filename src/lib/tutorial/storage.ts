/**
 * Firestore utilities for tutorial state management
 */
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseConfig";
import type { OnboardingState, TutorialState, TutorialPreferences, TourId } from "./types";

const DEFAULT_TUTORIAL_STATE: TutorialState = {
	dismissed: [],
	completed: [],
	lastSeenAt: null,
};

const DEFAULT_PREFERENCES: TutorialPreferences = {
	skipAllTours: false,
	autoStartTours: true,
};

/**
 * Get onboarding state from Firestore
 */
export async function getOnboardingState(uid: string): Promise<OnboardingState | null> {
	try {
		const userRef = doc(db, "users", uid);
		const snap = await getDoc(userRef);
		
		if (!snap.exists()) {
			return null;
		}

		const data = snap.data();
		const onboarding = data.onboarding;

		if (!onboarding) {
			return null;
		}

		return {
			selectedPath: onboarding.selectedPath || null,
			checklistCompleted: onboarding.checklistCompleted || false,
			checklistCompletedAt: onboarding.checklistCompletedAt?.toDate() || null,
			tutorials: {
				dismissed: onboarding.tutorials?.dismissed || [],
				completed: onboarding.tutorials?.completed || [],
				lastSeenAt: onboarding.tutorials?.lastSeenAt?.toDate() || null,
			},
			tourPreferences: {
				skipAllTours: onboarding.tourPreferences?.skipAllTours || false,
				autoStartTours: onboarding.tourPreferences?.autoStartTours ?? true,
			},
		};
	} catch (error) {
		console.error("Failed to get onboarding state:", error);
		return null;
	}
}

/**
 * Initialize onboarding state with defaults if it doesn't exist
 */
export async function initializeOnboardingState(uid: string): Promise<void> {
	try {
		const userRef = doc(db, "users", uid);
		const snap = await getDoc(userRef);
		
		if (!snap.exists()) {
			console.warn("User document doesn't exist, cannot initialize onboarding state");
			return;
		}

		const data = snap.data();
		
		// Only initialize if onboarding field doesn't exist
		if (!data.onboarding) {
			await updateDoc(userRef, {
				onboarding: {
					selectedPath: null,
					checklistCompleted: false,
					checklistCompletedAt: null,
					tutorials: DEFAULT_TUTORIAL_STATE,
					tourPreferences: DEFAULT_PREFERENCES,
				},
			});
		}
	} catch (error) {
		console.error("Failed to initialize onboarding state:", error);
	}
}

/**
 * Update tutorial state (dismissed/completed tours)
 */
export async function updateTutorialState(
	uid: string,
	updates: Partial<TutorialState>
): Promise<void> {
	try {
		const userRef = doc(db, "users", uid);
		
		const updateData: any = {
			"onboarding.tutorials.lastSeenAt": serverTimestamp(),
		};

		if (updates.dismissed !== undefined) {
			updateData["onboarding.tutorials.dismissed"] = updates.dismissed;
		}
		if (updates.completed !== undefined) {
			updateData["onboarding.tutorials.completed"] = updates.completed;
		}
		if (updates.lastSeenAt !== undefined) {
			updateData["onboarding.tutorials.lastSeenAt"] = updates.lastSeenAt instanceof Date
				? Timestamp.fromDate(updates.lastSeenAt)
				: serverTimestamp();
		}

		await updateDoc(userRef, updateData);
	} catch (error) {
		console.error("Failed to update tutorial state:", error);
		throw error;
	}
}

/**
 * Dismiss a specific tour
 */
export async function dismissTour(uid: string, tourId: TourId): Promise<void> {
	try {
		const currentState = await getOnboardingState(uid);
		if (!currentState) {
			await initializeOnboardingState(uid);
		}

		const userRef = doc(db, "users", uid);
		const currentDismissed = currentState?.tutorials.dismissed || [];
		
		if (!currentDismissed.includes(tourId)) {
			await updateDoc(userRef, {
				"onboarding.tutorials.dismissed": [...currentDismissed, tourId],
				"onboarding.tutorials.lastSeenAt": serverTimestamp(),
			});
		}
	} catch (error) {
		console.error("Failed to dismiss tour:", error);
		throw error;
	}
}

/**
 * Mark a tour as completed
 */
export async function completeTour(uid: string, tourId: TourId): Promise<void> {
	try {
		const currentState = await getOnboardingState(uid);
		if (!currentState) {
			await initializeOnboardingState(uid);
		}

		const userRef = doc(db, "users", uid);
		const currentCompleted = currentState?.tutorials.completed || [];
		
		if (!currentCompleted.includes(tourId)) {
			await updateDoc(userRef, {
				"onboarding.tutorials.completed": [...currentCompleted, tourId],
				"onboarding.tutorials.lastSeenAt": serverTimestamp(),
			});
		}
	} catch (error) {
		console.error("Failed to complete tour:", error);
		throw error;
	}
}

/**
 * Update tour preferences
 */
export async function updateTourPreferences(
	uid: string,
	preferences: Partial<TutorialPreferences>
): Promise<void> {
	try {
		const userRef = doc(db, "users", uid);
		
		const updateData: any = {};
		if (preferences.skipAllTours !== undefined) {
			updateData["onboarding.tourPreferences.skipAllTours"] = preferences.skipAllTours;
		}
		if (preferences.autoStartTours !== undefined) {
			updateData["onboarding.tourPreferences.autoStartTours"] = preferences.autoStartTours;
		}

		if (Object.keys(updateData).length > 0) {
			await updateDoc(userRef, updateData);
		}
	} catch (error) {
		console.error("Failed to update tour preferences:", error);
		throw error;
	}
}

