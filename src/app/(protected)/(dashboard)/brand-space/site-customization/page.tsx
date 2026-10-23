"use client";

import React, { useState } from "react";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useSiteCustomization } from "@/hooks/useSiteCustomization";
import { useEffect } from "react";
import StorefrontStatus from "@/components/brand/site-customization/StorefrontStatus";
import TemplateGallery from "@/components/brand/site-customization/TemplateGallery";
import ActiveTemplateSummary from "@/components/brand/site-customization/ActiveTemplateSummary";
import SectionControlsList from "@/components/brand/site-customization/SectionControlsList";
import {
	Template,
	StorefrontSection,
	BrandIdentity,
} from "@/lib/models/site-customization";
import CustomizationFeatures from "@/components/brand/site-customization/CustomizationFeatures";
import BrandIdentityView from "@/components/brand/site-customization/BrandIdentityView";
import UpgradeModal from "@/components/brand/site-customization/UpgradeModal";
import { AVAILABLE_TEMPLATES } from "@/lib/constants/templates";
import SectionInspector from "@/components/brand/site-customization/SectionInspector";
import Button from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter, useSearchParams } from "next/navigation";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import {
	canUseTemplateForPlan,
	DEFAULT_FREE_STOREFRONT_TEMPLATE_ID,
	getSectionsForPlanSave,
	isSectionLockedForPlan,
	sanitizeBrandIdentityForPlan,
} from "@/lib/plans/free-storefront";
import { getThemeAccess } from "@/lib/plans/theme-access";
import { getPreferredStorefrontUrl } from "@/lib/brand/storefrontUrl";
import { getStorefrontThemeEntitlements } from "@/lib/firebase/callables/siteCustomization";
import { toast } from "@/app/hooks/use-toast";

export default function SiteCustomizationPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { activeRole, roleDetection, user } = useDashboardContext();
	const shouldOpenActiveTemplate = searchParams.get("open") === "active-template";

	// State for templates
	const [templates, setTemplates] = useState<Template[]>(AVAILABLE_TEMPLATES);
	const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
	// Premium themes this brand owns (empty until the callable resolves)
	const [entitledThemeIds, setEntitledThemeIds] = useState<Set<string>>(
		new Set(),
	);

	// Active Editor State
	const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
		null,
	);
	const [liveTemplateId, setLiveTemplateId] = useState<string | null>(null);

	const [activeSections, setActiveSections] = useState<StorefrontSection[]>([]);
	const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
		null,
	);
	const [sectionOverrides, setSectionOverrides] = useState<Record<string, any>>(
		{},
	);
	const [brandIdentity, setBrandIdentity] = useState<BrandIdentity | undefined>(
		undefined,
	);
	const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);

	// Role checks
	const isBrand = activeRole === "brand";
	const isPro = roleDetection?.brandSubscriptionTier === "pro";
	// Use brandSlug for domain logic (it falls back to username in context)
	const username =
		roleDetection?.brandSlug || roleDetection?.brandUsername || "brand";
	const brandName = roleDetection?.brandName || "Brand";

	// Customization Action Hooks
	const {
		isSaving,
		activateTemplate,
		saveSections,
		saveIdentity,
		saveSectionOverrides,
	} = useSiteCustomization(user?.uid);

	// Load Realtime Brand Config
	useEffect(() => {
		if (!user?.uid) return;

		// Dynamic import to ensure client-side execution for firestore
		const { watchBrandDoc } = require("@/lib/firebase/queries/brandspace");
		const unsubscribe = watchBrandDoc(user.uid, (brand: any) => {
			if (brand?.storefrontConfig && templates.length > 0) {
				const config = brand.storefrontConfig;
				const effectiveTemplateId =
					isPro || canUseTemplateForPlan(config.templateId, false)
						? config.templateId
						: DEFAULT_FREE_STOREFRONT_TEMPLATE_ID;

				// 1. Sync Active Template
				if (effectiveTemplateId) {
					setLiveTemplateId(effectiveTemplateId);

					// Sync Content Overrides
					if (config.contentOverrides) {
						setSectionOverrides(config.contentOverrides);
					} else {
						setSectionOverrides({});
					}

					// Only auto-open editor if we aren't already editing something else
					// OR if we want to force sync. Choosing to sync "Live" state mostly.
					if (!editingTemplateId) {
						if (shouldOpenActiveTemplate) {
							setEditingTemplateId(effectiveTemplateId);
						}
					}

					// Sync Identity
					if (config.identity) {
						setBrandIdentity(config.identity);
					}

					// 2. Sync Sections (Merge config with defaults)
					const template = templates.find(
						(t: any) => t.id === effectiveTemplateId,
					);
					if (template) {
						let mergedSections = [...template.defaultSections];

						// Reorder
						if (config.sectionOrder?.length) {
							mergedSections.sort((a, b) => {
								const indexA = config.sectionOrder.indexOf(a.id);
								const indexB = config.sectionOrder.indexOf(b.id);
								if (indexA === -1) return 1;
								if (indexB === -1) return -1;
								return indexA - indexB;
							});
						}

						// Enable/Disable
						mergedSections = mergedSections.map((s) => ({
							...s,
							enabled: config.enabledSections?.includes(s.id) ?? s.enabled,
						}));

						setActiveSections(mergedSections);
					}
				}
			}
		});

		return () => unsubscribe();
	}, [user?.uid, templates, shouldOpenActiveTemplate, editingTemplateId, isPro]);

	// Load which premium themes the brand owns
	useEffect(() => {
		if (!user?.uid) return;
		let cancelled = false;
		getStorefrontThemeEntitlements(user.uid).then((ids) => {
			if (!cancelled) setEntitledThemeIds(ids);
		});
		return () => {
			cancelled = true;
		};
	}, [user?.uid]);

	// Handlers
	const handleUpgrade = () => {
		setIsUpgradeModalOpen(true);
	};

	// Theme checkout isn't on web yet (parity task B-7b). Until it is, say so
	// instead of letting the brand activate a theme the server will reject.
	const handlePurchaseTheme = (template: Template) => {
		toast({
			title: `${template.name} is a premium theme`,
			description:
				"Buying themes isn't available on web yet. You can get it in the Labeld Studio mobile app, then it will unlock here.",
			duration: 6000,
		});
	};

	const handleApplyTemplate = async (id: string) => {
		const template = templates.find((t) => t.id === id);
		if (!template) return;
		const access = getThemeAccess(template, isPro, entitledThemeIds);
		if (access === "needs_purchase") {
			handlePurchaseTheme(template);
			return;
		}
		if (access === "needs_pro") {
			handleUpgrade();
			return;
		}

		// If editing the currently live template, preserve its state
		if (id === liveTemplateId) {
			setEditingTemplateId(id);
			// Do NOT reset activeSections, they are already synced by the useEffect
			// Do NOT call activateTemplate again
			return;
		}

		// Switching to a NEW template
		setEditingTemplateId(id); // Open Editor
		setLiveTemplateId(id); // Optimistic switch
		setActiveSections(template.defaultSections); // Load defaults for new template

		await activateTemplate(id);
	};

	const handleChangeTemplate = () => {
		// Go back to gallery
		setEditingTemplateId(null);
		setSelectedSectionId(null); // Clear selection too
	};

	const handleUpdateSections = async (newSections: StorefrontSection[]) => {
		// Local update
		setActiveSections(newSections);
		await saveSections(getSectionsForPlanSave(newSections, isPro));
	};

	const handleToggleSection = async (sectionId: string, enabled: boolean) => {
		const targetSection = activeSections.find((s) => s.id === sectionId);
		if (targetSection && isSectionLockedForPlan(targetSection, isPro)) {
			handleUpgrade();
			return;
		}

		const newSections = activeSections.map((s) =>
			s.id === sectionId ? { ...s, enabled } : s,
		) as StorefrontSection[];

		setActiveSections(newSections);
		await saveSections(getSectionsForPlanSave(newSections, isPro));
	};

	const handleSelectSection = (sectionId: string) => {
		const section = activeSections.find((s) => s.id === sectionId);
		if (section && isSectionLockedForPlan(section, isPro)) {
			handleUpgrade();
			return;
		}

		if (selectedSectionId === sectionId) {
			setSelectedSectionId(null); // Deselect
		} else {
			setSelectedSectionId(sectionId);
		}
	};

	const handleSaveOverride = async (
		sectionId: string,
		updates: Record<string, any>,
	) => {
		// Optimistic local update
		setSectionOverrides((prev) => ({
			...prev,
			[sectionId]: updates,
		}));

		const section = activeSections.find((s) => s.id === sectionId);
		if (section && isSectionLockedForPlan(section, isPro)) {
			handleUpgrade();
			return;
		}

		if (isAutoSaveEnabled) {
			await saveSectionOverrides(sectionId, updates);
		}
	};

	const handleManualSave = async () => {
		if (!selectedSectionId) return;
		const section = activeSections.find((s) => s.id === selectedSectionId);
		if (section && isSectionLockedForPlan(section, isPro)) {
			handleUpgrade();
			return;
		}
		const currentOverrides = sectionOverrides[selectedSectionId];
		if (currentOverrides) {
			await saveSectionOverrides(selectedSectionId, currentOverrides);
		}
	};

	const handleSaveIdentity = async (identity: BrandIdentity) => {
		await saveIdentity(sanitizeBrandIdentityForPlan(identity, isPro));
	};

	// Tabs State - must be declared before any early returns per React hooks rules
	const [activeTab, setActiveTab] = useState<"design" | "identity">("design");

	if (!isBrand) {
		return (
			<div className="min-h-[50vh] flex items-center justify-center text-text-muted">
				Site customization is only available for Brands.
			</div>
		);
	}

	const activeTemplate = templates.find((t) => t.id === editingTemplateId);

	return (
		<div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 md:px-6 lg:px-8">
			{/* Header & Tabs */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-stroke">
				<div>
					<h1 className="font-heading font-semibold text-2xl md:text-3xl text-text">
						Site Customization
					</h1>
					<p className="text-text-muted mt-2 text-base md:text-lg">
						Control how your brand appears to the world.
					</p>
				</div>

				{/* Tabs */}
				<div className="flex items-center p-1 bg-surface border border-stroke rounded-lg">
					<button
						onClick={() => setActiveTab("design")}
						className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
							activeTab === "design"
								? "bg-bg text-text shadow-sm"
								: "text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5"
						}`}
					>
						Layout & Design
					</button>
					<button
						onClick={() => setActiveTab("identity")}
						className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
							activeTab === "identity"
								? "bg-bg text-text shadow-sm"
								: "text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5"
						}`}
					>
						Brand Identity
					</button>
				</div>
			</div>
			<OnboardingChecklist />
			{/* Content Area */}
			{activeTab === "design" ? (
				// Existing Design/Templates Flow
				!editingTemplateId ? (
					<>
						{/* 1. Storefront Status */}
						<section>
							<StorefrontStatus
								username={username}
								storefrontUrl={getPreferredStorefrontUrl(roleDetection)}
								brandName={brandName}
								isPro={isPro}
							/>
						</section>

						<hr className="border-stroke" />

						{/* 2. Template Gallery */}
						<section>
							<TemplateGallery
								templates={templates}
								isPro={isPro}
								entitledThemeIds={entitledThemeIds}
								activeTemplateId={liveTemplateId}
								onApply={handleApplyTemplate}
								onUpgrade={handleUpgrade}
								onPurchase={handlePurchaseTheme}
							/>
						</section>

						<hr className="border-stroke" />

						{/* 3. Customization Capabilities */}
						<section>
							<CustomizationFeatures isPro={isPro} />
						</section>
					</>
				) : (
					// Active Template View (Section Controls + Inspector)
					<div className="space-y-6">
						{/* Editor Header */}
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleChangeTemplate}
									className="-ml-2 text-text-muted hover:text-text"
								>
									← Change Template
								</Button>
								<span className="text-stroke">|</span>
								<span className="font-medium text-text">
									Editing: {activeTemplate?.name}
								</span>
							</div>

							{/* Actions */}
							<div className="flex flex-col md:flex-row items-end md:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
								<div className="flex items-center gap-2 mr-4">
									<span className="text-xs font-medium text-text-muted">
										Auto-Save
									</span>
									<Switch
										checked={isAutoSaveEnabled}
										onCheckedChange={setIsAutoSaveEnabled}
										className="scale-90 data-[state=checked]:bg-cta border-transparent"
									/>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											const url = getPreferredStorefrontUrl(roleDetection);
											if (url) window.open(url, "_blank");
										}}
									>
										Preview Store
									</Button>
									<Button
										size="sm"
										disabled={isSaving}
										onClick={() => setEditingTemplateId(null)}
									>
										Done
									</Button>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
							{/* Left Column: Sections List */}
							<div className="lg:col-span-7 space-y-6">
								<div className="bg-surface border border-stroke rounded-2xl p-6">
									<SectionControlsList
										sections={activeSections}
										isPro={isPro}
										onReorder={handleUpdateSections}
										onToggle={handleToggleSection}
										onLockedAction={handleUpgrade}
										selectedSectionId={selectedSectionId}
										onSelect={handleSelectSection}
									/>
								</div>

								<div className="bg-surface border border-stroke rounded-2xl p-6">
									{/* Using props from original usage, ensuring compatibility */}
									<BrandIdentityView
										isPro={isPro}
										onUpdate={handleSaveIdentity}
										onLockedAction={handleUpgrade}
										isSaving={isSaving}
										brandProfileLogo={roleDetection?.brandLogoUrl}
										initialIdentity={brandIdentity}
									/>
								</div>
							</div>

							{/* Right Column: Inspector (Sticky / Mobile Drawer) */}
							<div
								className={`
                                lg:col-span-5 
                                ${
																	selectedSectionId
																		? "fixed inset-0 z-50 bg-bg flex flex-col lg:static lg:bg-transparent lg:block"
																		: "hidden lg:sticky lg:top-6 lg:block"
																}
                            `}
							>
								{/* Mobile Header (Visible only on mobile when inspector open) */}
								{selectedSectionId && (
									<div className="lg:hidden flex items-center justify-between p-4 border-b border-stroke bg-surface sticky top-0 z-10">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setSelectedSectionId(null)}
										>
											Cancel
										</Button>
										<span className="font-semibold text-sm">Edit Section</span>
										<div className="flex gap-2">
											{!isAutoSaveEnabled && (
												<Button
													size="sm"
													onClick={handleManualSave}
													disabled={isSaving}
												>
													Save
												</Button>
											)}
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelectedSectionId(null)}
											>
												Done
											</Button>
										</div>
									</div>
								)}

								<div
									className={`
                                    bg-surface border border-stroke rounded-2xl overflow-hidden min-h-[400px] h-full lg:h-auto overflow-y-auto lg:overflow-visible
                                    ${
																			selectedSectionId
																				? "rounded-none border-none lg:rounded-2xl lg:border"
																				: ""
																		}
                                `}
								>
									{selectedSectionId ? (
										(() => {
											const section = activeSections.find(
												(s) => s.id === selectedSectionId,
											);
											const defaults = activeTemplate?.defaultSections.find(
												(s) => s.id === selectedSectionId,
											);
											if (!section || !defaults) return null;

											return (
												<div className="relative">
													{/* Desktop Manual Save Indicator */}
													{!isAutoSaveEnabled && (
														<div className="hidden lg:flex justify-end p-2 bg-surface-2 border-b border-stroke">
															<Button
																size="sm"
																onClick={handleManualSave}
																disabled={isSaving}
															>
																Save Changes
															</Button>
														</div>
													)}
													<SectionInspector
														section={section}
														defaults={defaults}
														overrides={sectionOverrides[selectedSectionId]}
														isPro={isPro}
														isSaving={isSaving}
														onSave={handleSaveOverride}
														onLockedAction={handleUpgrade}
													/>
												</div>
											);
										})()
									) : (
										<div className="h-full flex flex-col items-center justify-center p-12 text-center text-text-muted opacity-60">
											<p>Select a section to edit its content.</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				)
			) : (
				// Identity View
				<BrandIdentityView
					isPro={isPro}
					onUpdate={handleSaveIdentity}
					onLockedAction={handleUpgrade}
					isSaving={isSaving}
					brandProfileLogo={roleDetection?.brandLogoUrl}
					initialIdentity={brandIdentity}
				/>
			)}
			{/* Upgrade Modal */}
			<UpgradeModal
				isOpen={isUpgradeModalOpen}
				onClose={() => setIsUpgradeModalOpen(false)}
				onUpgrade={() => router.push("/pricing")}
			/>
		</div>
	);
}
