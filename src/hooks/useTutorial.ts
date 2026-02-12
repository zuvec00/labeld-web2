/**
 * Hook for managing tutorial state and tours
 */
import { useContext } from "react";
import { TutorialContext } from "@/components/tutorial/TutorialProvider";
import type { TourId } from "@/lib/tutorial/types";

export function useTutorial() {
	const context = useContext(TutorialContext);
	
	if (!context) {
		throw new Error("useTutorial must be used within TutorialProvider");
	}

	return {
		...context,
		/**
		 * Start a tour
		 */
		startTour: (tourId: TourId) => {
			context.setActiveTourId(tourId);
			context.setCurrentStepIndex(0);
		},
		
		/**
		 * Skip the current tour
		 */
		skipTour: async () => {
			if (context.activeTourId) {
				await context.dismissTour(context.activeTourId);
				context.setActiveTourId(null);
				context.setCurrentStepIndex(0);
			}
		},
		
		/**
		 * Complete the current tour
		 */
		completeTour: async () => {
			if (context.activeTourId) {
				await context.completeTour(context.activeTourId);
				context.setActiveTourId(null);
				context.setCurrentStepIndex(0);
			}
		},
		
		/**
		 * Go to next step
		 */
		nextStep: () => {
			if (context.activeTourId && context.tourConfig) {
				const maxSteps = context.tourConfig.steps.length;
				if (context.currentStepIndex < maxSteps - 1) {
					context.setCurrentStepIndex(context.currentStepIndex + 1);
				} else {
					// Last step - complete tour
					context.completeTour(context.activeTourId);
				}
			}
		},
		
		/**
		 * Go to previous step
		 */
		previousStep: () => {
			if (context.currentStepIndex > 0) {
				context.setCurrentStepIndex(context.currentStepIndex - 1);
			}
		},
		
		/**
		 * Check if a tour was dismissed
		 */
		isTourDismissed: (tourId: TourId): boolean => {
			return context.tutorialState?.dismissed.includes(tourId) || false;
		},
		
		/**
		 * Check if a tour was completed
		 */
		isTourCompleted: (tourId: TourId): boolean => {
			return context.tutorialState?.completed.includes(tourId) || false;
		},
	};
}

