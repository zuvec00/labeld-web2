import { useState, useEffect } from "react";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useToast } from "@/app/hooks/use-toast";
import {
	watchEventOrganizerDoc,
	updateEventStorefrontConfig,
} from "@/lib/firebase/queries/eventOrganizer";

export function useEventSiteCustomization() {
	const { user, roleDetection } = useDashboardContext();
	const { toast } = useToast();

	const [config, setConfig] = useState<any>(null); // Use proper type after importing
	const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Derived state
	const isPro = roleDetection?.eventSubscriptionTier === "pro";

	// Realtime Sync
	useEffect(() => {
		if (!user?.uid) {
			setLoading(false);
			return;
		}

		// Dynamic import to ensure client-side execution if needed,
		// though standard import matches project pattern.
		const unsubscribe = watchEventOrganizerDoc(user.uid, (organizer) => {
			if (organizer?.storefrontConfig) {
				setConfig(organizer.storefrontConfig);
				if (organizer.storefrontConfig.templateId) {
					setActiveTemplateId(organizer.storefrontConfig.templateId);
				} else {
					setActiveTemplateId(null);
				}
			} else {
				setConfig(null);
				setActiveTemplateId(null);
			}
			setLoading(false);
		});

		return () => unsubscribe();
	}, [user?.uid]);

	// Actions
	const activateTemplate = async (templateId: string) => {
		if (!user?.uid) return;

		// 1. Gate Check
		if (!isPro) {
			toast({
				title: "Pro Plan Required",
				description:
					"You need to upgrade to the Pro plan to activate templates.",
				variant: "destructive",
			});
			return; // UI should also handle this redirection
		}

		// 2. Optimistic / Loading State
		setIsSaving(true);

		try {
			// 3. Write
			await updateEventStorefrontConfig(user.uid, {
				templateId: templateId,
			});

			toast({
				title: "Template Activated",
				description: "Your event site is now using this theme.",
			});
		} catch (error) {
			console.error("Failed to activate template:", error);
			toast({
				title: "Activation Failed",
				description: "Something went wrong. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const updateConfig = async (updates: Record<string, any>) => {
		if (!user?.uid) return;
		setIsSaving(true);
		try {
			await updateEventStorefrontConfig(user.uid, updates);
		} catch (error) {
			console.error("Failed to update config:", error);
			toast({
				title: "Update Failed",
				description: "Could not save your changes. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const isTemplateActive = (templateId: string) =>
		activeTemplateId === templateId;

	return {
		activeTemplateId,
		isTemplateActive,
		activateTemplate,
		updateConfig,
		config,
		loading,
		isSaving,
		isPro,
	};
}
