"use client";

import { useDashboardContext } from "@/hooks/useDashboardContext";
// import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import {
	Lock,
	Sparkles,
	LayoutTemplate,
	Globe,
	CheckCircle2,
	ExternalLink,
	Layers,
} from "lucide-react";
import { AfterHoursTemplate, SocialiteTemplate } from "./preview/page";

import { useEventSiteCustomization } from "@/hooks/useEventSiteCustomization";
import { EventSection, EventOrganizerIdentity } from "@/lib/models/eventSite";
import EventSectionControls from "@/components/events/site-customization/EventSectionControls";
import EventIdentityControls from "@/components/events/site-customization/EventIdentityControls";
import EventSectionInspector from "@/components/events/site-customization/EventSectionInspector";
import EventOnboardingChecklist from "@/components/onboarding/EventOnboardingChecklist";

// Mock templates for the UI
const MOCK_TEMPLATES = [
	{
		id: "after-hours",
		name: "After Hours",
		description:
			"Dark, energetic vibe for clubs and parties. Visual-first layout.",
		vibe: "Nightlife",
		status: "available",
		defaultThemeMode: "dark",
		themeModeLocked: true,
	},
	{
		id: "socialite",
		name: "Socialite",
		description: "Clean, photo-first layout for brunches and mixers.",
		vibe: "Social",
		status: "available",
		defaultThemeMode: "light",
		themeModeLocked: true,
	},
	{
		id: "venue",
		name: "Venue / Restaurant",
		description: "Hospitality-first layout for restaurants and lounges.",
		vibe: "Hospitality",
		status: "available",
		defaultThemeMode: "dark",
		themeModeLocked: false,
	},
];

// Default sections for templates
const AFTER_HOURS_DEFAULTS: EventSection[] = [
	{
		id: "hero-1",
		type: "hero",
		enabled: true,
		isRequired: true,
		variant: "immersive",
	},
	{ id: "featured-1", type: "featuredEvent", enabled: true, layout: "split" },
	{
		id: "upcoming-1",
		type: "upcomingEvents",
		enabled: true,
		isRequired: true,
		layout: "posterGrid",
	},
	{
		id: "past-1",
		type: "pastEvents",
		enabled: true,
		layout: "posterCarousel",
	},
	// {
	// 	id: "gallery-1",
	// 	type: "gallery",
	// 	enabled: true,
	// 	layout: "carousel",
	// 	isLocked: false,
	// },
	// { id: "venue-1", type: "venueInfo", enabled: true, isLocked: false },
	{
		id: "footer-1",
		type: "footer",
		enabled: true,
		isRequired: true,
		showSocialLinks: true,
		showContactInfo: true,
		isLocked: true,
	},
];

const SOCIALITE_DEFAULTS: EventSection[] = [
	{
		id: "soc-hero-1",
		type: "hero",
		enabled: true,
		isRequired: true,
		variant: "minimal",
	},
	{
		id: "soc-featured-1",
		type: "featuredEvent",
		enabled: true,
		layout: "card",
		isLocked: false,
	},
	{
		id: "soc-upcoming-1",
		type: "upcomingEvents",
		enabled: true,
		isRequired: true,
		layout: "cards",
	},
	// {
	// 	id: "soc-gallery-1",
	// 	type: "gallery",
	// 	enabled: true,
	// 	layout: "masonry",
	// 	isLocked: false,
	// },
	{
		id: "soc-past-1",
		type: "pastEvents",
		enabled: false,
		layout: "grid",
	}, // Defaults hidden
	// {
	// 	id: "soc-venue-1",
	// 	type: "venueInfo",
	// 	enabled: false,
	// 	isLocked: false,
	// }, // Defaults hidden
	{
		id: "soc-footer-1",
		type: "footer",
		enabled: true,
		isRequired: true,
		showSocialLinks: true,
		showContactInfo: true,
		isLocked: true,
	},
];

const VENUE_DEFAULTS: EventSection[] = [
	{
		id: "venue-hero-1",
		type: "hero",
		enabled: true,
		isRequired: true,
		variant: "immersive",
		isLocked: true, // Order locked
	},
	{
		id: "venue-identity-1",
		type: "aboutOrganizer",
		enabled: true,
		isLocked: true, // Order locked
		description:
			"A rooftop sanctuary blending fine dining with late-night energy. Where culinary artistry meets the city's pulse.",
	},
	{
		id: "venue-nights-1",
		type: "upcomingEvents", // "Curated Nights"
		title: "Curated Nights",
		enabled: true,
		isRequired: true, // Added required field
		layout: "posterGrid", // Changed from "manual" to valid type
		filter: "manual",
		maxItems: 3,
		isLocked: true, // Order locked
	},
	{
		id: "venue-gallery-1",
		type: "gallery",
		enabled: true,
		layout: "masonry",
		isLocked: true, // Order locked
	},
	{
		id: "venue-menu-1",
		type: "menu",
		title: "Menu Preview",
		enabled: true,
		isLocked: true, // Order locked
	},
	{
		id: "venue-location-1",
		type: "venueInfo",
		enabled: true,
		isLocked: true, // Order locked,
		// This section handles Location & Hours
	},
	{
		id: "venue-footer-1",
		type: "footer",
		enabled: true,
		isRequired: true,
		showSocialLinks: true,
		showContactInfo: true,
		isLocked: true,
	},
];

export default function EventSiteCustomizationPage() {
	const router = useRouter();
	const { roleDetection, loading } = useDashboardContext();
	const [devTemplates, setDevTemplates] = useState<any[]>([]);

	// Customization Hook
	const {
		activeTemplateId,
		isTemplateActive,
		activateTemplate,
		config,
		updateConfig,
		isSaving,
		isPro: hookIsPro, // Rename to avoid collision or just remove local definition
	} = useEventSiteCustomization();

	const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
		null,
	);
	const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
		null,
	);

	if (loading)
		return (
			<div className="h-[50vh] grid place-items-center">
				<Spinner size="lg" />
			</div>
		);

	// Default to "free" if not specified
	const subscriptionTier = roleDetection?.eventSubscriptionTier || "free";
	const isPro = subscriptionTier === "pro";
	const eventSlug = roleDetection?.eventSlug || "your-slug";

	// Dev mode check
	const isDev = process.env.NODE_ENV === "development";

	const handleSeedTemplates = () => {
		setDevTemplates(MOCK_TEMPLATES);
		console.log("Seeded templates to local state");
	};

	// Determine functionality based on dev seed or static list
	const templates =
		isDev && devTemplates.length > 0 ? devTemplates : MOCK_TEMPLATES;

	// SECTION LOGIC
	const getDefaultSections = (templateId: string) => {
		if (templateId === "socialite") return SOCIALITE_DEFAULTS;
		if (templateId === "venue") return VENUE_DEFAULTS;
		return AFTER_HOURS_DEFAULTS;
	};

	const getCurrentSections = () => {
		// Use editingTemplateId if set, otherwise activeTemplateId (fallback)
		const targetId = editingTemplateId || activeTemplateId;
		if (!targetId) return [];

		const defaults = getDefaultSections(targetId);

		// If we are editing the ACTIVE template, use the real config
		// If we are editing a NON-ACTIVE template (preview mode editor?), we might want to just show defaults
		// For now, assume we only customize the ACTIVE template, or if we force customize a non-active one, it shows defaults.
		const isEditingActive = targetId === activeTemplateId;

		if (!isEditingActive || (!config?.sectionOrder && !config?.enabledSections))
			return defaults;

		const currentOrder = config.sectionOrder || defaults.map((s) => s.id);
		const enabledSet = new Set(
			config.enabledSections ||
				defaults.filter((s) => s.enabled).map((s) => s.id),
		);

		const orderedSections = currentOrder
			.map((id: string) => defaults.find((s) => s.id === id))
			.filter(Boolean) as EventSection[];

		defaults.forEach((s) => {
			if (!orderedSections.find((os) => os.id === s.id)) {
				orderedSections.push(s);
			}
		});

		return orderedSections.map((s) => ({
			...s,
			enabled: enabledSet.has(s.id),
		}));
	};

	const currentSections = getCurrentSections();

	const handleActivate = async (templateName: string, templateId: string) => {
		if (
			window.confirm(
				`Execute activation for "${templateName}"?\n\nThis will update your live event site theme immediately.`,
			)
		) {
			await activateTemplate(templateId);
			// Auto-enter editor after activation? Optional.
			// setEditingTemplateId(templateId);
		}
	};

	const handleCustomize = (templateId: string) => {
		setEditingTemplateId(templateId);
	};

	const handleToggleSection = async (sectionId: string, enabled: boolean) => {
		if (!activeTemplateId) return;
		// Only allow saving if we are editing the active template
		if (editingTemplateId !== activeTemplateId) {
			alert("You must activate this template to save changes.");
			return;
		}

		const defaults = getDefaultSections(activeTemplateId);
		const currentEnabled =
			config?.enabledSections ||
			defaults.filter((s) => s.enabled).map((s) => s.id);

		let newEnabled: string[];
		if (enabled) {
			newEnabled = [...new Set([...currentEnabled, sectionId])];
		} else {
			newEnabled = currentEnabled.filter((id: string) => id !== sectionId);
		}

		await updateConfig({
			enabledSections: newEnabled,
		});
	};

	const handleReorderSections = async (newSections: EventSection[]) => {
		if (!activeTemplateId) return;
		if (editingTemplateId !== activeTemplateId) return;

		const newOrder = newSections.map((s) => s.id);
		await updateConfig({
			sectionOrder: newOrder,
		});
	};

	const handleUpdateIdentity = async (identity: EventOrganizerIdentity) => {
		if (!activeTemplateId) return;
		// Only allow saving if we are editing the active template or we decide to allow it in preview
		if (editingTemplateId !== activeTemplateId) {
			alert("You must activate this template to save changes.");
			return;
		}

		await updateConfig({
			identity,
		});
	};

	const handleSelectSection = (sectionId: string) => {
		if (selectedSectionId === sectionId) {
			setSelectedSectionId(null);
		} else {
			setSelectedSectionId(sectionId);
		}
	};

	const handleSectionSave = async (
		sectionId: string,
		updates: Partial<EventSection>,
	) => {
		if (!activeTemplateId) return;

		// Merge with existing settings
		const currentSettings = config?.sectionSettings || {};
		const mergedSettings = {
			...currentSettings,
			[sectionId]: updates,
		};

		await updateConfig({
			sectionSettings: mergedSettings,
		});
	};

	// --- VIEWS ---

	// VIEW 1: GALLERY
	if (!editingTemplateId) {
		return (
			<div className="p-4 md:p-6 lg:p-12 max-w-6xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-500 pb-24">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl md:text-3xl font-heading font-bold mb-2 break-words">
							Event Site Customization
						</h1>
						<p className="text-text-muted text-sm md:text-base">
							Manage your dedicated experience website presence.
						</p>
					</div>
					{isDev && (
						<Button
							text="Seed Templates (Dev)"
							variant="secondary"
							size="sm"
							onClick={handleSeedTemplates}
						/>
					)}
				</div>
				<EventOnboardingChecklist />
				{/* SECTION 1: Experience Website Status */}
				<section className="bg-surface border border-stroke rounded-xl p-5 md:p-6 lg:p-8 relative overflow-hidden">
					<div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
						<Globe className="w-32 h-32 rotate-12" />
					</div>

					<div className="flex flex-col md:flex-row gap-6 items-start justify-between relative z-10">
						<div className="space-y-4 max-w-2xl w-full">
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
										isPro
											? "bg-primary/10 text-primary"
											: "bg-bg-subtle text-text-muted"
									}`}
								>
									<Globe className="w-5 h-5" />
								</div>
								<div>
									<h2 className="text-lg font-semibold font-heading">
										{isPro
											? "Experience Website Active"
											: "Experience Website: Inactive"}
									</h2>
									<p className="text-sm text-text-muted text-pretty max-w-lg">
										{isPro
											? "Your site showcases all published events and supports ticket sales."
											: "Upgrade to Pro to launch your own dedicated event website at a custom URL."}
									</p>
								</div>
							</div>

							{isPro && (
								<div className="p-3 bg-bg-subtle rounded-lg border border-stroke inline-flex items-center gap-3 max-w-full overflow-hidden">
									<span className="text-sm font-mono text-text-muted truncate">
										https://{eventSlug}.labeld.app/
									</span>
									<Badge
										variant="successEvents"
										className="text-[10px] shrink-0"
									>
										Live
									</Badge>
									<a
										href={`https://events.labeld.app/${eventSlug}`}
										target="_blank"
										rel="noreferrer"
										className="p-1 hover:bg-surface rounded-md transition-colors"
									>
										<ExternalLink className="w-3.5 h-3.5 text-text-muted hover:text-text" />
									</a>
								</div>
							)}
						</div>

						<div className="flex-shrink-0 w-full md:w-auto">
							{!isPro && (
								<div className="flex flex-col gap-3 items-start md:items-end">
									<Button
										text="Upgrade to Pro"
										variant="primary"
										className="bg-events"
										onClick={() => router.push("/pricing?mode=organizer")}
									/>
								</div>
							)}
						</div>
					</div>
				</section>
				{/* SECTION 2: Templates Gallery */}
				<section>
					<div className="mb-6">
						<h2 className="text-xl font-bold font-heading flex items-center gap-2">
							<LayoutTemplate className="w-5 h-5 shrink-0" /> Available
							Templates
						</h2>
						<p className="text-text-muted mt-1 text-sm bg-bg-subtle/50 inline-block px-2 py-0.5 rounded-md border border-stroke text-xs">
							Preview how your events look with different vibes.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{templates.map((template: any) => {
							const isLocked = template.status === "coming-soon";
							const isActive = isTemplateActive(template.id);

							return (
								<div
									key={template.id}
									className={`
									relative group rounded-xl border border-stroke bg-surface overflow-hidden transition-all flex flex-col
									${isActive ? "ring-2 ring-primary border-primary/50" : ""}
									${!isActive && isPro ? "hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5" : ""} 
									${isLocked ? "opacity-60 grayscale cursor-not-allowed" : ""}
								`}
								>
									{/* Preview Area (Same as before) */}
									<div className="aspect-[4/3] bg-bg-subtle relative overflow-hidden flex flex-col items-center justify-center group-hover:bg-bg-subtle/80 transition-colors">
										{template.id === "after-hours" ? (
											<div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
												<div className="text-white font-bold text-2xl tracking-tighter uppercase font-heading mb-2">
													AFTER HOURS
												</div>
												<div className="w-12 h-0.5 bg-purple-500 mb-4"></div>
												<div className="grid grid-cols-3 gap-2 w-full max-w-[120px] opacity-30">
													<div className="bg-white/20 aspect-[3/4] rounded-sm"></div>
													<div className="bg-white/20 aspect-[3/4] rounded-sm"></div>
													<div className="bg-white/20 aspect-[3/4] rounded-sm"></div>
												</div>
											</div>
										) : template.id === "socialite" ? (
											<div className="absolute inset-0 bg-[#F5F5F4] flex flex-col items-center justify-center p-6 text-center select-none cursor-default">
												<div className="w-8 h-8 rounded-full bg-stone-200 mb-3 border border-stone-300/50"></div>
												<div className="text-stone-800 font-serif text-xl tracking-tight leading-none mb-2">
													The Sunday <br /> Collective
												</div>
												<div className="w-8 h-0.5 bg-orange-300/50 mb-3 rounded-full"></div>
												<div className="grid grid-cols-2 gap-2 w-full max-w-[120px] opacity-40">
													<div className="bg-stone-300 aspect-square rounded-sm"></div>
													<div className="bg-stone-300 aspect-square rounded-sm"></div>
												</div>
											</div>
										) : template.id === "venue" ? (
											<div className="absolute inset-0 bg-neutral-900 flex flex-col items-center p-4 text-center select-none cursor-default">
												{/* Hero Strip */}
												<div className="w-full h-12 bg-neutral-800 rounded-md mb-3 flex items-center justify-center relative overflow-hidden">
													<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
													<span className="relative text-white font-heading text-lg font-bold tracking-widest uppercase">
														TERRACE
													</span>
												</div>
												{/* Reservation Widget Mock */}
												<div className="w-full bg-neutral-800/50 p-2 rounded-md mb-2 flex gap-1 justify-center">
													<div className="h-2 w-8 bg-neutral-700 rounded-full"></div>
													<div className="h-2 w-8 bg-neutral-700 rounded-full opacity-50"></div>
													<div className="h-2 w-8 bg-neutral-700 rounded-full opacity-50"></div>
												</div>
												{/* Menu Tiles */}
												<div className="grid grid-cols-3 gap-2 w-full mt-auto opacity-60">
													<div className="aspect-square bg-neutral-800 rounded-sm"></div>
													<div className="aspect-square bg-neutral-800 rounded-sm"></div>
													<div className="aspect-square bg-neutral-800 rounded-sm"></div>
												</div>
											</div>
										) : (
											<Sparkles className="w-8 h-8 text-text-muted/20" />
										)}
										{/* Status Overlays */}
										{!isPro && !isLocked && (
											<div className="absolute top-3 right-3 pointer-events-none">
												<Badge
													variant="secondary"
													className="bg-surface/90 backdrop-blur shadow-sm border border-stroke gap-1"
												>
													<Lock className="w-3 h-3" /> Pro
												</Badge>
											</div>
										)}
										{isLocked && template.id !== "socialite" && (
											<div className="absolute inset-0 bg-bg/10 backdrop-blur-[1px] flex items-center justify-center">
												<Badge variant="secondary">Coming Soon</Badge>
											</div>
										)}
									</div>

									{/* Info */}
									<div className="p-5 border-t border-stroke flex flex-col flex-1 justify-between gap-4">
										<div>
											<div className="flex justify-between items-start mb-1">
												<h3 className="font-semibold text-lg">
													{template.name}
												</h3>
												{isActive && (
													<Badge variant="success" className="text-[10px]">
														Active
													</Badge>
												)}
											</div>
											<p className="text-xs text-text-muted line-clamp-2">
												{template.description}
											</p>
										</div>
										<div className="flex gap-2 mt-auto pt-2">
											<Button
												text="Preview"
												variant="outline"
												className="w-full text-xs font-medium border-events text-events"
												disabled={isLocked}
												onClick={(e: React.MouseEvent) => {
													e.stopPropagation();
													router.push(
														`/events/site-customization/preview?template=${template.id}`,
													);
												}}
											/>
											{!isLocked && (
												<Button
													text={
														isActive
															? "Customize" // Changed from "Active" to "Customize"
															: isPro
																? "Activate"
																: "Upgrade"
													}
													variant={
														isActive
															? "secondary" // Changed style to indicate it's clickable
															: isPro
																? "primary"
																: "cta"
													}
													className={`w-full text-xs ${isActive ? "border border-stroke" : "bg-events"}`}
													disabled={isSaving} // Only disabled if saving, not if active
													onClick={() => {
														if (!isPro) {
															router.push("/pricing");
															return;
														}
														if (isActive) {
															handleCustomize(template.id);
														} else {
															handleActivate(template.name, template.id);
														}
													}}
												/>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</section>
				{/* SECTION 3: Capabilities */}
				<section className="bg-bg-subtle/30 rounded-xl p-6 md:p-8 border border-stroke border-dashed">
					<h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-6">
						Website Features
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
						{[
							"Customizable public page URL",
							"Hero banner & branding",
							"Integrated ticket sales",
							"Featured events showcase",
							"Mobile-optimized",
							"Analytics integration",
						].map((capability, i) => (
							<div key={i} className="flex items-start gap-3">
								<CheckCircle2
									className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
										isPro ? "text-purple-500" : "text-text-muted opacity-50"
									}`}
								/>
								<span
									className={`text-sm ${isPro ? "text-text" : "text-text-muted"}`}
								>
									{capability}
								</span>
							</div>
						))}
					</div>
				</section>
			</div>
		);
	}

	// VIEW 2: EDITOR
	const editingTemplate = templates.find((t) => t.id === editingTemplateId);
	const editingTemplateName = editingTemplate?.name || "Template";
	const isEditingActive = activeTemplateId === editingTemplateId;

	return (
		<div className="p-4 md:p-6 lg:p-12 max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right-8 fade-in duration-300 pb-24">
			{/* Editor Header */}
			<div className="flex items-center gap-4 border-b border-stroke pb-6">
				<Button
					variant="ghost"
					onClick={() => setEditingTemplateId(null)}
					leftIcon={<Layers className="w-4 h-4 -ml-1 text-text-muted" />} // Using Layers as fallback if ArrowLeft issue
					text="Templates"
					className="text-text-muted hover:text-text"
				/>
				<div className="h-6 w-px bg-stroke"></div>
				<div>
					<h1 className="text-xl font-heading font-bold">
						Editing: {editingTemplateName}
					</h1>
					{!isEditingActive && (
						<p className="text-xs text-amber-500 font-medium mt-0.5">
							Preview Mode (Not Active)
						</p>
					)}
				</div>
				<div className="ml-auto flex gap-2">
					<Button
						text="Open Preview"
						variant="outline"
						size="sm"
						onClick={() =>
							router.push(
								`/events/site-customization/preview?template=${editingTemplateId}`,
							)
						}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-[calc(100vh-220px)]">
				{/* Left Column: Structure & Navigation (4 cols) */}
				<div className="lg:col-span-5 space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-20">
					{/* Page Structure */}
					<div className="bg-surface border border-stroke rounded-xl p-5 shadow-sm">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-sm font-bold font-heading uppercase tracking-wider text-text-muted">
								Page Structure
							</h2>
							<div className="scale-75 origin-right">
								{isSaving ? (
									<Badge variant="secondary" className="gap-1 animate-pulse">
										Saving...
									</Badge>
								) : (
									<Badge variant="secondary" className="gap-1">
										<CheckCircle2 className="w-3 h-3 text-green-500" /> Saved
									</Badge>
								)}
							</div>
						</div>

						<EventSectionControls
							sections={currentSections}
							isPro={isPro}
							onToggle={handleToggleSection}
							onReorder={handleReorderSections}
							onLockedAction={() => {}}
							selectedSectionId={selectedSectionId}
							onSelect={handleSelectSection}
						/>
					</div>

					{/* Identity Controls */}
					<div className="bg-surface border border-stroke rounded-xl p-5 shadow-sm">
						<h3 className="text-sm font-bold font-heading uppercase tracking-wider text-text-muted mb-4">
							Brand Identity
						</h3>
						<EventIdentityControls
							isPro={isPro}
							initialIdentity={config?.identity}
							userProfileLogo={roleDetection?.organizerLogoUrl}
							onUpdate={handleUpdateIdentity}
							onLockedAction={() => router.push("/pricing")}
							isSaving={isSaving}
							themeModeLocked={editingTemplate?.themeModeLocked}
							defaultThemeMode={editingTemplate?.defaultThemeMode}
						/>
					</div>
				</div>

				{/* Right Column: Unified Editor Workspace (8 cols) */}
				<div className="hidden lg:flex lg:col-span-7 h-full bg-surface border border-stroke rounded-xl overflow-hidden shadow-sm flex-col">
					{selectedSectionId ? (
						<EventSectionInspector
							section={currentSections.find((s) => s.id === selectedSectionId)!}
							defaults={
								templates
									.find((t) => t.id === (editingTemplateId || activeTemplateId))
									?.defaultSections?.find(
										(s: { id: string }) => s.id === selectedSectionId,
									) ||
								getDefaultSections(
									editingTemplateId || activeTemplateId || "",
								).find((s) => s.id === selectedSectionId)!
							}
							overrides={config?.sectionSettings?.[selectedSectionId]}
							isPro={isPro}
							isSaving={isSaving}
							templateId={editingTemplateId || activeTemplateId || ""}
							onSave={handleSectionSave}
							onLockedAction={() => {}}
							onClose={() => setSelectedSectionId(null)}
						/>
					) : (
						<div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-muted">
							<div className="flex items-center gap-2 mb-4">
								<div className="flex items-center gap-1.5 bg-bg px-2 py-1 rounded text-xs text-text-muted border border-stroke">
									<Globe className="w-3 h-3" />
									<span>{eventSlug}.labeld.app</span>
									<ExternalLink className="w-3 h-3 opacity-50" />
								</div>
							</div>
							<h3 className="font-medium text-text mb-1">Select a Section</h3>
							<p className="text-sm">
								Click on a section from the structure list on the left to edit
								its settings.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Mobile Inspector Drawer */}
			{selectedSectionId && (
				<div className="lg:hidden fixed inset-0 z-50 bg-bg flex flex-col animate-in slide-in-from-bottom-full duration-300">
					<EventSectionInspector
						section={currentSections.find((s) => s.id === selectedSectionId)!}
						defaults={
							getDefaultSections(
								editingTemplateId || activeTemplateId || "",
							).find((s) => s.id === selectedSectionId)!
						}
						overrides={config?.sectionSettings?.[selectedSectionId]}
						isPro={isPro}
						isSaving={isSaving}
						templateId={editingTemplateId || activeTemplateId || ""}
						onSave={handleSectionSave}
						onLockedAction={() => {}}
						onClose={() => setSelectedSectionId(null)}
					/>
				</div>
			)}
		</div>
	);
}
