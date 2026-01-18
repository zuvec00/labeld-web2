import { useState } from "react";
import { useToast } from "@/app/hooks/use-toast";
import {
	activateStorefrontTemplate,
	updateStorefrontSections,
	updateBrandTokens,
	updateSectionContentOverrides,
} from "@/lib/firebase/callables/siteCustomization";
import { BrandIdentity, StorefrontSection } from "@/lib/models/site-customization";

export function useSiteCustomization(brandId?: string) {
	const { toast } = useToast();
	const [isSaving, setIsSaving] = useState(false);

	// Helper to handle async actions with toast
	const handleAction = async (
		actionName: string,
		fn: () => Promise<any>,
		successMessage: string
	) => {
		if (!brandId) {
			toast({
				title: "Error",
				description: "Brand ID is missing.",
				variant: "destructive",
			});
			return false;
		}

		setIsSaving(true);
		try {
			await fn();
			toast({
				title: "Success",
				description: successMessage,
			});
			return true;
		} catch (error: any) {
			console.error(`${actionName} Error:`, error);
			// Parse error message (e.g., PRO_REQUIRED)
			const message = error.message || "Something went wrong.";
			
			toast({
				title: "Action Failed",
				description: message.includes("PRO_REQUIRED") 
					? "Verify your subscription plan." 
					: message,
				variant: "destructive",
			});
			return false;
		} finally {
			setIsSaving(false);
		}
	};

	const activateTemplate = async (templateId: string) => {
		return handleAction(
			"activateTemplate",
			() => activateStorefrontTemplate(brandId!, templateId),
			"Template activated successfully."
		);
	};

	const saveSections = async (sections: StorefrontSection[]) => {
		return handleAction(
			"saveSections",
			() => updateStorefrontSections(brandId!, sections),
			"Section configuration saved."
		);
	};

	const saveIdentity = async (identity: BrandIdentity) => {
		return handleAction(
			"saveIdentity",
			() => updateBrandTokens(brandId!, identity),
			"Brand identity saved."
		);
	};

	const saveSectionOverrides = async (
		sectionId: string,
		updates: Record<string, any>
	) => {
		return handleAction(
			"saveContentOverrides",
			() => updateSectionContentOverrides(brandId!, sectionId, updates),
			"Content saved."
		);
	};

	return {
		isSaving,
		activateTemplate,
		saveSections,
		saveIdentity,
		saveSectionOverrides,
	};
}
