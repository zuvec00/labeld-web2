import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/firebaseConfig";
import { BrandIdentity, StorefrontSection } from "@/lib/models/site-customization";

// 1. Activate Storefront Template
interface ActivateTemplatePayload {
	brandId: string;
	templateId: string;
}

export const activateStorefrontTemplate = async (
	brandId: string,
	templateId: string
) => {
	const callable = httpsCallable<ActivateTemplatePayload, { success: boolean }>(
		functions,
		"activateStorefrontTemplate"
	);
	const result = await callable({ brandId, templateId });
	return result.data;
};

// 2. Update Section Controls
interface UpdateSectionsPayload {
	brandId: string;
	sectionOrder: string[];
	enabledSections: string[];
}

export const updateStorefrontSections = async (
	brandId: string,
	sections: StorefrontSection[]
) => {
	// Transform full objects to arrays of IDs
	const sectionOrder = sections.map((s) => s.id);
	const enabledSections = sections.filter((s) => s.enabled).map((s) => s.id);

	const callable = httpsCallable<UpdateSectionsPayload, { success: boolean }>(
		functions,
		"updateStorefrontSections"
	);
	const result = await callable({ brandId, sectionOrder, enabledSections });
	return result.data;
};

// 3. Update Brand Tokens
interface UpdateTokensPayload {
	brandId: string;
	tokens: BrandIdentity;
}

export const updateBrandTokens = async (
	brandId: string,
	tokens: BrandIdentity
) => {
	const callable = httpsCallable<UpdateTokensPayload, { success: boolean }>(
		functions,
		"updateBrandTokens"
	);
	const result = await callable({ brandId, tokens });
	return result.data;
};

// 4. Update Section Content Overrides (V1 CMS)
interface UpdateContentOverridesPayload {
	brandId: string;
	sectionId: string;
	updates: Record<string, any>;
}

export const updateSectionContentOverrides = async (
	brandId: string,
	sectionId: string,
	updates: Record<string, any>
) => {
	const callable = httpsCallable<UpdateContentOverridesPayload, { success: boolean }>(
		functions,
		"updateSectionContentOverrides"
	);
	const result = await callable({ brandId, sectionId, updates });
	return result.data;
};
