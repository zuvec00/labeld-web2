import { useDashboardContext } from "./useDashboardContext";
import { useBrandOnboardingStatus } from "./useBrandOnboardingStatus";
import { useEventOnboardingStatus } from "./useEventOnboardingStatus";

/**
 * Unified hook that returns the appropriate onboarding status based on the active role.
 * This provides a single interface for components that need to display onboarding checklists
 * without needing to know which role is active.
 * 
 * @returns The onboarding status for the current active role (brand or eventOrganizer)
 */
export function useOnboardingState() {
	const { activeRole } = useDashboardContext();
	const brandStatus = useBrandOnboardingStatus();
	const eventStatus = useEventOnboardingStatus();

	// Return the appropriate status based on active role
	if (activeRole === "eventOrganizer") {
		return eventStatus;
	}

	// Default to brand (also handles "brand" role explicitly)
	return brandStatus;
}

