"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import {
	getOnboardingState,
	initializeOnboardingState,
	dismissTour as dismissTourStorage,
	completeTour as completeTourStorage,
	updateTourPreferences,
} from "@/lib/tutorial/storage";
import { getTour } from "@/lib/tutorial/tours";
import type {
	OnboardingState,
	TourId,
	TutorialPreferences,
} from "@/lib/tutorial/types";

interface TutorialContextValue {
	// State
	onboardingState: OnboardingState | null;
	tutorialState: OnboardingState["tutorials"] | null;
	preferences: TutorialPreferences | null;
	activeTourId: TourId | null;
	currentStepIndex: number;
	tourConfig: ReturnType<typeof getTour> | null;
	loading: boolean;

	// Setters
	setActiveTourId: (tourId: TourId | null) => void;
	setCurrentStepIndex: (index: number) => void;

	// Actions
	dismissTour: (tourId: TourId) => Promise<void>;
	completeTour: (tourId: TourId) => Promise<void>;
	updatePreferences: (prefs: Partial<TutorialPreferences>) => Promise<void>;
	refreshState: () => Promise<void>;
}

export const TutorialContext = createContext<TutorialContextValue | null>(null);

interface TutorialProviderProps {
	children: React.ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
	const { user } = useAuth();
	const searchParams = useSearchParams();
	const router = useRouter();
	const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
	const [activeTourId, setActiveTourId] = useState<TourId | null>(null);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [loading, setLoading] = useState(true);

	// Get tour config for active tour
	const tourConfig = activeTourId ? getTour(activeTourId) : null;

	// Load onboarding state from Firestore
	const loadState = useCallback(async () => {
		if (!user?.uid) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			
			// Initialize if needed
			await initializeOnboardingState(user.uid);
			
			// Load state
			const state = await getOnboardingState(user.uid);
			setOnboardingState(state);
		} catch (error) {
			console.error("Failed to load tutorial state:", error);
		} finally {
			setLoading(false);
		}
	}, [user?.uid]);

	// Load state on mount and when user changes
	useEffect(() => {
		loadState();
	}, [loadState]);

	// Support starting a tour via query param (?tour=brand-setup)
	useEffect(() => {
		const tourParam = searchParams?.get("tour") as TourId | null;
		if (!tourParam) return;

		// Only allow known tours
		const config = getTour(tourParam);
		if (!config) return;

		// Wait until state is loaded
		if (loading) return;

		// Respect global preference
		if (onboardingState?.tourPreferences?.skipAllTours) return;

		// Start the tour
		setActiveTourId(tourParam);
		setCurrentStepIndex(0);

		// Remove the param to avoid restarting on refresh
		try {
			const url = new URL(window.location.href);
			url.searchParams.delete("tour");
			router.replace(url.pathname + (url.search ? url.search : ""));
		} catch {
			// ignore
		}
	}, [searchParams, loading, onboardingState?.tourPreferences?.skipAllTours, router]);

	// Dismiss tour
	const dismissTour = useCallback(
		async (tourId: TourId) => {
			if (!user?.uid) return;
			
			try {
				await dismissTourStorage(user.uid, tourId);
				await loadState(); // Refresh state
			} catch (error) {
				console.error("Failed to dismiss tour:", error);
			}
		},
		[user?.uid, loadState]
	);

	// Complete tour
	const completeTour = useCallback(
		async (tourId: TourId) => {
			if (!user?.uid) return;
			
			try {
				await completeTourStorage(user.uid, tourId);
				await loadState(); // Refresh state
				setActiveTourId(null);
				setCurrentStepIndex(0);
			} catch (error) {
				console.error("Failed to complete tour:", error);
			}
		},
		[user?.uid, loadState]
	);

	// Update preferences
	const updatePrefs = useCallback(
		async (prefs: Partial<TutorialPreferences>) => {
			if (!user?.uid) return;
			
			try {
				await updateTourPreferences(user.uid, prefs);
				await loadState(); // Refresh state
			} catch (error) {
				console.error("Failed to update preferences:", error);
			}
		},
		[user?.uid, loadState]
	);

	const value: TutorialContextValue = {
		onboardingState,
		tutorialState: onboardingState?.tutorials || null,
		preferences: onboardingState?.tourPreferences || null,
		activeTourId,
		currentStepIndex,
		tourConfig,
		loading,
		setActiveTourId,
		setCurrentStepIndex,
		dismissTour,
		completeTour,
		updatePreferences: updatePrefs,
		refreshState: loadState,
	};

	return (
		<TutorialContext.Provider value={value}>
			{children}
		</TutorialContext.Provider>
	);
}

