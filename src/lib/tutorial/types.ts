/**
 * Tutorial system types and interfaces
 */

export type TourId = "brand-setup" | "event-setup" | "orders" | "wallet";

export type TourStepPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStep {
	/** CSS selector or data attribute to target element */
	target: string;
	/** Step title */
	title: string;
	/** Step description */
	description: string;
	/** Tooltip placement relative to target */
	placement?: TourStepPlacement;
	/** Optional action to perform when step is shown */
	action?: {
		type: "navigate" | "scroll" | "focus" | "none";
		href?: string;
		selector?: string;
	};
}

export interface TourConfig {
	/** Unique tour identifier */
	id: TourId;
	/** Tour display name */
	title: string;
	/** Tour description */
	description?: string;
	/** Steps in the tour */
	steps: TourStep[];
}

export interface TutorialState {
	/** Tours that have been dismissed by the user */
	dismissed: TourId[];
	/** Tours that have been completed */
	completed: TourId[];
	/** Last time tutorials were seen */
	lastSeenAt: Date | null;
}

export interface TutorialPreferences {
	/** Skip all tours globally */
	skipAllTours: boolean;
	/** Auto-start tours on first visit */
	autoStartTours: boolean;
}

export interface OnboardingState {
	/** Selected onboarding path */
	selectedPath: "brand" | "event" | null;
	/** Whether checklist is completed */
	checklistCompleted: boolean;
	/** When checklist was completed */
	checklistCompletedAt: Date | null;
	/** Tutorial state */
	tutorials: TutorialState;
	/** Tour preferences */
	tourPreferences: TutorialPreferences;
}

