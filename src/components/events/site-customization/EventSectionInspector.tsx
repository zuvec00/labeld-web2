"use client";

import React, { useState, useEffect, useMemo } from "react";
import Button from "@/components/ui/button";
import { EventSection } from "@/lib/models/eventSite";
import { Lock, RotateCcw, X, Check, Calendar, RotateCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { uploadBrandImageWeb } from "@/lib/storage/upload";
import UploadImage from "@/components/ui/upload-image";
import { useToast } from "@/app/hooks/use-toast";
import { useUploadStore } from "@/lib/stores/upload";
import { uploadFileDirectCloudinary } from "@/lib/storage/cloudinary";

// Firebase imports for event fetching
import { db } from "@/lib/firebase/firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { EventModel } from "@/lib/models/event";
import { Spinner } from "@/components/ui/spinner";
import OptimizedImage from "@/components/ui/OptimizedImage";

// Preview Components
import {
	AfterHoursHero,
	AfterHoursFeatured,
	AfterHoursUpcoming,
	AfterHoursPast,
	AfterHoursFooter,
	SocialiteHero,
	SocialiteFeatured,
	SocialiteUpcoming,
	SocialitePast,
	SocialiteFooter,
} from "@/app/(protected)/(dashboard)/events/site-customization/preview/page";

interface EventSectionInspectorProps {
	section: EventSection;
	defaults: EventSection;
	overrides?: Partial<EventSection>;
	isPro: boolean;
	isSaving: boolean;
	templateId: string;
	onSave: (sectionId: string, updates: Partial<EventSection>) => void;
	onLockedAction: () => void;
	onClose: () => void;
}

// Helper for Consistent Control UI
const ControlWrapper = ({
	label,
	isCustom,
	onReset,
	children,
}: {
	label: string;
	isCustom: boolean;
	onReset: () => void;
	children: React.ReactNode;
}) => {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<label className="text-xs font-medium text-text-muted uppercase tracking-wider">
					{label}
				</label>
				<div className="flex items-center gap-2">
					{isCustom ? (
						<span className="text-[10px] font-bold text-events px-1.5 py-0.5 bg-events/10 rounded">
							Custom
						</span>
					) : (
						<span className="text-[10px] font-medium text-text-muted/50 px-1.5 py-0.5 bg-surface-2 rounded">
							Default
						</span>
					)}
					{isCustom && (
						<button
							onClick={onReset}
							className="text-text-muted hover:text-text transition-colors p-1 hover:bg-surface-2 rounded"
							title="Reset to default"
						>
							<RotateCcw className="w-3 h-3" />
						</button>
					)}
				</div>
			</div>
			{children}
		</div>
	);
};

export default function EventSectionInspector({
	section,
	defaults,
	overrides,
	isPro,
	isSaving,
	templateId,
	onSave,
	onLockedAction,
	onClose,
}: EventSectionInspectorProps) {
	const { user } = useDashboardContext();
	const { toast } = useToast();
	const [localOverrides, setLocalOverrides] = useState<Partial<EventSection>>(
		overrides || {},
	);
	const [uploading, setUploading] = useState(false);
	const { addUpload, updateUpload, removeUpload } = useUploadStore();

	// Events State for Featured Selection
	const [myEvents, setMyEvents] = useState<EventModel[]>([]);
	const [loadingEvents, setLoadingEvents] = useState(false);

	// Sync local state
	useEffect(() => {
		setLocalOverrides(overrides || {});
	}, [section.id, overrides]);

	// Fetch Events if needed
	useEffect(() => {
		const fetchEvents = async () => {
			if (section.type !== "featuredEvent" || !user?.uid) return;
			if (myEvents.length > 0) return;

			try {
				setLoadingEvents(true);
				const q = query(
					collection(db, "events"),
					where("createdBy", "==", user.uid),
					orderBy("createdAt", "desc"),
				);
				const snap = await getDocs(q);
				const loadedEvents = snap.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as EventModel[];
				setMyEvents(loadedEvents);
			} catch (err) {
				console.error("Failed to fetch events", err);
			} finally {
				setLoadingEvents(false);
			}
		};

		fetchEvents();
	}, [section.type, user?.uid, myEvents.length]);

	const handleChange = (field: string, value: any) => {
		const newOverrides = {
			...localOverrides,
			[field]: value,
		};
		setLocalOverrides(newOverrides);
	};

	const handleSave = (field?: string, value?: any) => {
		const stateToSave =
			field && value !== undefined
				? { ...localOverrides, [field]: value }
				: localOverrides;

		onSave(section.id, stateToSave);
	};

	const handleBlur = () => {
		handleSave();
	};

	const handleReset = (field: string) => {
		const newOverrides = { ...localOverrides };
		newOverrides[field as keyof EventSection] = null as any;
		setLocalOverrides(newOverrides);
		onSave(section.id, newOverrides);
	};

	const isCustom = (field: string) => {
		const val = localOverrides[field as keyof EventSection];
		return val !== undefined && val !== null;
	};

	const handleImageUpload = async (
		file: File | null,
		fieldName: string = "imageUrl",
	) => {
		if (!file) {
			handleReset(fieldName);
			return;
		}
		if (!user?.uid) return;

		const uploadId = addUpload({
			type: "image",
			fileName: file.name,
			progress: 0,
			status: "uploading",
		});
		const upload = useUploadStore
			.getState()
			.uploads.find((u) => u.id === uploadId);
		const abortController = upload?.cancelController;

		try {
			setUploading(true);
			const url = await uploadFileDirectCloudinary(
				file,
				{
					folder: `events/${templateId}`,
					tags: ["event", templateId],
				},
				(progress) => {
					if (abortController?.signal.aborted) throw new Error("Cancelled");
					updateUpload(uploadId, { progress: Math.round(progress) });
				},
			);

			handleChange(fieldName, url);
			handleSave(fieldName, url);

			updateUpload(uploadId, { status: "completed", progress: 100 });
			setTimeout(() => removeUpload(uploadId), 3000);

			toast({ title: "Image Uploaded" });
		} catch (error) {
			updateUpload(uploadId, {
				status: "error",
				error: error instanceof Error ? error.message : "Upload failed",
			});
			console.error(error);
			toast({ title: "Upload Failed", variant: "destructive" });
		} finally {
			setUploading(false);
		}
	};

	// Calculate Merged Config for Live Preview
	const previewConfig = useMemo(() => {
		const mergedSection = {
			...defaults,
			...section,
			...localOverrides,
		};
		return {
			sectionSettings: {
				[section.id]: mergedSection, // e.g. "hero-1": { ... }
			},
		};
	}, [defaults, section, localOverrides]);

	const renderPreview = () => {
		// Identify selected event for Featured Section
		const pinnedId = (previewConfig.sectionSettings[section.id] as any)
			?.pinnedEventId;
		const selectedEvent = myEvents.find((e) => e.id === pinnedId);

		// After Hours
		if (templateId === "after-hours") {
			if (section.type === "hero")
				return <AfterHoursHero config={previewConfig} />;
			if (section.type === "featuredEvent")
				return (
					<AfterHoursFeatured
						config={previewConfig}
						eventData={selectedEvent}
					/>
				);
			if (section.type === "upcomingEvents")
				return <AfterHoursUpcoming config={previewConfig} />;
			if (section.type === "pastEvents")
				return <AfterHoursPast config={previewConfig} />;
			if (section.type === "footer")
				return <AfterHoursFooter config={previewConfig} />;
		}
		// Socialite
		if (templateId === "socialite") {
			if (section.type === "hero")
				return <SocialiteHero config={previewConfig} />;
			if (section.type === "featuredEvent")
				return (
					<SocialiteFeatured config={previewConfig} eventData={selectedEvent} />
				);
			if (section.type === "upcomingEvents")
				return <SocialiteUpcoming config={previewConfig} />;
			if (section.type === "pastEvents")
				return <SocialitePast config={previewConfig} />;
			if (section.type === "footer")
				return <SocialiteFooter config={previewConfig} />;
		}

		return (
			<div className="flex items-center justify-center h-full text-text-muted text-xs p-8">
				Preview not available for this section type.
			</div>
		);
	};

	if (!isPro) {
		return (
			<div className="h-full flex flex-col items-center justify-center p-8 text-center border-l border-stroke bg-surface/50 relative overflow-hidden">
				<Lock className="w-8 h-8 text-text-muted mb-4 opacity-50" />
				<h3 className="text-text font-semibold mb-2">Pro Feature</h3>
				<p className="text-text-muted text-sm mb-6 max-w-[240px]">
					Unlock Pro to edit content.
				</p>
				<Button text="Upgrade" onClick={onLockedAction} />
			</div>
		);
	}

	const renderFields = () => {
		const heroSection = section as any;
		const heroDefaults = defaults as any;
		const heroOverrides = localOverrides as any;
		const featOverrides = localOverrides as any;
		const upcomingOverrides = localOverrides as any;
		const venueOverrides = localOverrides as any;
		const aboutOverrides = localOverrides as any;

		switch (section.type) {
			case "hero":
				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Navigation Logo"
							isCustom={isCustom("logoUrl")}
							onReset={() => handleReset("logoUrl")}
						>
							<UploadImage
								text="Upload Logo"
								value={null}
								onChange={async (file) => {
									if (!file) {
										handleReset("logoUrl");
										return;
									}
									if (user?.uid) {
										const uploadId = addUpload({
											type: "image",
											fileName: file.name,
											progress: 0,
											status: "uploading",
										});
										const upload = useUploadStore
											.getState()
											.uploads.find((u) => u.id === uploadId);
										const abortController = upload?.cancelController;

										setUploading(true);
										try {
											const url = await uploadFileDirectCloudinary(
												file,
												{
													folder: `events/${templateId}/logos`,
													tags: ["event", "logo", templateId],
												},
												(progress) => {
													if (abortController?.signal.aborted)
														throw new Error("Cancelled");
													updateUpload(uploadId, {
														progress: Math.round(progress),
													});
												},
											);

											handleChange("logoUrl", url);
											handleSave("logoUrl", url);

											updateUpload(uploadId, {
												status: "completed",
												progress: 100,
											});
											setTimeout(() => removeUpload(uploadId), 3000);

											toast({ title: "Logo Uploaded" });
										} catch (err) {
											updateUpload(uploadId, {
												status: "error",
												error:
													err instanceof Error ? err.message : "Upload failed",
											});
											console.error(err);
											toast({
												title: "Upload Failed",
												variant: "destructive",
											});
										} finally {
											setUploading(false);
										}
									}
								}}
								onlineImage={
									heroOverrides.logoUrl ??
									heroSection.logoUrl ??
									heroDefaults.logoUrl
								}
								singleImage={true}
								backgroundColor="var(--color-bg)"
								textColor="var(--color-text-muted)"
								className="h-20 w-auto aspect-[3/1]"
							/>
							<p className="text-[10px] text-text-muted mt-1">
								Replaces text headline in nav. Recommended: Transparent PNG.
							</p>
						</ControlWrapper>

						<ControlWrapper
							label="Background Image"
							isCustom={isCustom("imageUrl")}
							onReset={() => handleReset("imageUrl")}
						>
							<UploadImage
								text="Upload Banner"
								value={null}
								onChange={handleImageUpload}
								onlineImage={
									heroOverrides.imageUrl ??
									heroSection.imageUrl ??
									heroDefaults.imageUrl
								}
								singleImage={true}
								backgroundColor="var(--color-bg)"
								textColor="var(--color-text-muted)"
								className="h-40"
							/>
							<p className="text-[10px] text-text-muted mt-1">
								Recommended: 1600x900px JPG/PNG.
							</p>
						</ControlWrapper>

						<ControlWrapper
							label="Headline"
							isCustom={isCustom("headline")}
							onReset={() => handleReset("headline")}
						>
							<Input
								value={
									heroOverrides.headline ??
									heroSection.headline ??
									heroDefaults.headline ??
									""
								}
								onChange={(e) => handleChange("headline", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
							/>
						</ControlWrapper>

						<ControlWrapper
							label="Subheadline / Tagline"
							isCustom={isCustom("subheadline")}
							onReset={() => handleReset("subheadline")}
						>
							<Textarea
								value={
									heroOverrides.subheadline ??
									heroSection.subheadline ??
									heroDefaults.subheadline ??
									""
								}
								onChange={(e) => handleChange("subheadline", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
								placeholder="Short tagline (max 1 line)"
							/>
						</ControlWrapper>

						<div className="grid grid-cols-2 gap-4">
							<ControlWrapper
								label="Primary CTA Label"
								isCustom={isCustom("primaryCta")}
								onReset={() => handleReset("primaryCta")}
							>
								<Input
									value={
										heroOverrides.primaryCta?.label ??
										heroSection.primaryCta?.label ??
										heroDefaults.primaryCta?.label ??
										"Reserve"
									}
									onChange={(e) =>
										handleChange("primaryCta", {
											...heroOverrides.primaryCta,
											label: e.target.value,
										})
									}
									onBlur={handleBlur}
									className="bg-surface"
								/>
							</ControlWrapper>
							{/* Secondary CTA (Venue Layout Specific) */}
							<ControlWrapper
								label="Secondary CTA Label"
								isCustom={isCustom("secondaryCta")}
								onReset={() => handleReset("secondaryCta")}
							>
								<Input
									value={
										heroOverrides.secondaryCta?.label ??
										heroSection.secondaryCta?.label ??
										heroDefaults.secondaryCta?.label ??
										"Menu"
									}
									onChange={(e) =>
										handleChange("secondaryCta", {
											...heroOverrides.secondaryCta,
											label: e.target.value,
										})
									}
									onBlur={handleBlur}
									className="bg-surface"
								/>
							</ControlWrapper>
						</div>
					</div>
				);

			case "aboutOrganizer":
				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Short Description"
							isCustom={isCustom("description")}
							onReset={() => handleReset("description")}
						>
							<Textarea
								value={
									aboutOverrides.description ??
									(defaults as any).description ??
									""
								}
								onChange={(e) => handleChange("description", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface h-32"
								maxLength={240}
								placeholder="Describe the venue experience (~240 chars)"
							/>
							<div className="text-xs text-right text-text-muted mt-1">
								{aboutOverrides.description?.length || 0}/240
							</div>
						</ControlWrapper>

						<ControlWrapper
							label="Pull Quote (Optional)"
							isCustom={isCustom("pullQuote")}
							onReset={() => handleReset("pullQuote")}
						>
							<Input
								value={aboutOverrides.pullQuote ?? ""}
								onChange={(e) => handleChange("pullQuote", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
								placeholder="e.g. 'A sanctuary in the city'"
							/>
						</ControlWrapper>
					</div>
				);

			case "featuredEvent":
				const selectedId = featOverrides.pinnedEventId;

				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Section Title"
							isCustom={isCustom("title")}
							onReset={() => handleReset("title")}
						>
							<Input
								placeholder="e.g. Next Gathering"
								value={featOverrides.title ?? ""}
								onChange={(e) => handleChange("title", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
							/>
						</ControlWrapper>

						<div className="text-sm text-text-muted">
							Select an event to feature prominently on your site.
						</div>

						<ControlWrapper
							label="Selected Event"
							isCustom={isCustom("pinnedEventId")}
							onReset={() => handleReset("pinnedEventId")}
						>
							{loadingEvents ? (
								<div className="flex justify-center p-4">
									<Spinner />
								</div>
							) : myEvents.length === 0 ? (
								<div className="text-center p-4 border border-dashed border-stroke rounded-md text-text-muted text-sm">
									No events found. Create an event first.
								</div>
							) : (
								<div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
									{myEvents.map((event) => {
										const isSelected = selectedId === event.id;
										return (
											<div
												key={event.id}
												onClick={() => {
													handleChange("pinnedEventId", event.id);
													handleSave("pinnedEventId", event.id);
												}}
												className={`
													group flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all
													${
														isSelected
															? "bg-primary/5 border-primary shadow-sm"
															: "bg-surface border-stroke hover:border-text-muted"
													}
												`}
											>
												<div className="flex items-center gap-3 overflow-hidden">
													{/* Avatar */}
													<div className="w-10 h-10 rounded-md bg-bg-subtle flex-shrink-0 overflow-hidden relative border border-stroke/50">
														{event.coverImageURL ? (
															<OptimizedImage
																src={event.coverImageURL}
																alt={event.title}
																fill
																className="object-cover"
															/>
														) : (
															<div className="w-full h-full grid place-items-center">
																<Calendar className="w-4 h-4 text-text-muted/50" />
															</div>
														)}
													</div>
													{/* Text */}
													<div className="min-w-0">
														<div className="text-sm font-medium truncate text-text">
															{event.title}
														</div>
														<div className="text-xs text-text-muted truncate">
															{event.id}
														</div>
													</div>
												</div>

												{/* Selection Indicator */}
												<div
													className={`
													w-5 h-5 rounded-full border flex items-center justify-center transition-colors
													${
														isSelected
															? "bg-primary border-primary text-white"
															: "border-text-muted group-hover:border-text"
													}
												`}
												>
													{isSelected && <Check className="w-3 h-3" />}
												</div>
											</div>
										);
									})}
								</div>
							)}
						</ControlWrapper>
					</div>
				);

			case "upcomingEvents":
				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Section Title"
							isCustom={isCustom("title")}
							onReset={() => handleReset("title")}
						>
							<Input
								placeholder="e.g. Curated Nights"
								value={upcomingOverrides.title ?? ""}
								onChange={(e) => handleChange("title", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
							/>
						</ControlWrapper>

						<div className="flex items-center justify-between p-3 rounded-lg border border-stroke bg-surface">
							<div className="space-y-0.5">
								<label className="text-sm font-medium text-text">
									Curated Selection
								</label>
								<p className="text-xs text-text-muted">
									Manually select specific events to display
								</p>
							</div>
							<Switch
								checked={upcomingOverrides.filter === "manual"}
								onCheckedChange={(checked) => {
									const newVal = checked ? "manual" : "all";
									handleChange("filter", newVal);
									handleSave("filter", newVal);
								}}
							/>
						</div>

						{upcomingOverrides.filter === "manual" && (
							<ControlWrapper
								label="Select Events (Max 3)"
								isCustom={isCustom("manualEventIds")}
								onReset={() => handleReset("manualEventIds")}
							>
								{loadingEvents ? (
									<div className="flex justify-center p-4">
										<Spinner />
									</div>
								) : (
									<div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
										{myEvents.map((event) => {
											const selectedIds =
												upcomingOverrides.manualEventIds || [];
											const isSelected = selectedIds.includes(event.id);
											return (
												<div
													key={event.id}
													onClick={() => {
														let newIds = [...selectedIds];
														if (isSelected) {
															newIds = newIds.filter((id) => id !== event.id);
														} else {
															if (newIds.length >= 3) return; // Max 3
															newIds.push(event.id);
														}
														handleChange("manualEventIds", newIds);
														handleSave("manualEventIds", newIds);
													}}
													className={`
														group flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all
														${
															isSelected
																? "bg-primary/5 border-primary shadow-sm"
																: "bg-surface border-stroke hover:border-text-muted"
														}
														${!isSelected && selectedIds.length >= 3 ? "opacity-50 cursor-not-allowed" : ""}
													`}
												>
													<div className="flex items-center gap-3 overflow-hidden">
														<div className="w-10 h-10 rounded-md bg-bg-subtle flex-shrink-0 overflow-hidden relative">
															{event.coverImageURL && (
																<OptimizedImage
																	src={event.coverImageURL}
																	alt={event.title}
																	fill
																	className="object-cover"
																/>
															)}
														</div>
														<div className="min-w-0">
															<div className="text-sm font-medium truncate text-text">
																{event.title}
															</div>
														</div>
													</div>
													<div
														className={`
														w-5 h-5 rounded border flex items-center justify-center transition-colors
														${isSelected ? "bg-primary border-primary text-white" : "border-text-muted"}
													`}
													>
														{isSelected && <Check className="w-3 h-3" />}
													</div>
												</div>
											);
										})}
									</div>
								)}
							</ControlWrapper>
						)}
					</div>
				);

			case "menu":
				const menuOverrides = localOverrides as any;
				const menuItems = menuOverrides.items || [];

				const handleAddMenuItem = () => {
					const newItems = [...menuItems, { label: "", url: "" }];
					handleChange("items", newItems);
					handleSave("items", newItems);
				};

				const handleUpdateMenuItem = (
					index: number,
					field: string,
					value: any,
				) => {
					const newItems = [...menuItems];
					newItems[index] = { ...newItems[index], [field]: value };
					handleChange("items", newItems);
					handleSave("items", newItems);
				};

				const handleRemoveMenuItem = (index: number) => {
					const newItems = [...menuItems];
					newItems.splice(index, 1);
					handleChange("items", newItems);
					handleSave("items", newItems);
				};

				const handleMenuUpload = async (file: File | null, index: number) => {
					if (!file) return;

					// Determine type
					const isPdf = file.type === "application/pdf";
					const type = isPdf ? "pdf" : "image";

					const uploadId = addUpload({
						type: "image",
						fileName: file.name,
						progress: 0,
						status: "uploading",
					});
					const upload = useUploadStore
						.getState()
						.uploads.find((u) => u.id === uploadId);
					const abortController = upload?.cancelController;

					try {
						setUploading(true);
						const url = await uploadFileDirectCloudinary(
							file,
							{
								folder: `events/${templateId}/menus`,
								tags: ["event", "menu", templateId],
								resourceType: isPdf ? "raw" : "image",
							},
							(progress) => {
								if (abortController?.signal.aborted)
									throw new Error("Cancelled");
								updateUpload(uploadId, { progress: Math.round(progress) });
							},
						);

						if (url) {
							const newItems = [...menuItems];
							newItems[index] = { ...newItems[index], url, fileType: type };
							handleChange("items", newItems);
							handleSave("items", newItems);

							updateUpload(uploadId, { status: "completed", progress: 100 });
							setTimeout(() => removeUpload(uploadId), 3000);

							toast({ title: "Menu uploaded" });
						}
					} catch (e) {
						updateUpload(uploadId, {
							status: "error",
							error: e instanceof Error ? e.message : "Upload failed",
						});
						console.error(e);
						toast({ title: "Upload failed", variant: "destructive" });
					} finally {
						setUploading(false);
					}
				};

				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Section Title"
							isCustom={isCustom("title")}
							onReset={() => handleReset("title")}
						>
							<Input
								placeholder="e.g. Seasonal Highlights"
								value={menuOverrides.title ?? ""}
								onChange={(e) => handleChange("title", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
							/>
						</ControlWrapper>

						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<label className="text-sm font-medium text-text">
									Menu Items
								</label>
								<Button
									variant="outline"
									className="px-3 h-8 text-xs"
									onClick={handleAddMenuItem}
									text="Add Menu"
									leftIcon={
										<RotateCw className="w-3 h-3 group-hover:rotate-90 transition-transform" />
									} // Re-using RotateCw as Plus placeholder if Plus not imported, wait, let's just use Text "Add" or Import Plus
								/>
							</div>

							<div className="space-y-3">
								{menuItems.map((item: any, i: number) => (
									<div
										key={i}
										className="flex gap-3 items-start p-3 bg-surface rounded-lg border border-stroke group"
									>
										{/* File Preview / Upload */}
										<div className="relative w-16 h-16 flex-shrink-0 bg-surface-2 rounded-md border border-dashed border-stroke hover:border-text-muted transition-colors cursor-pointer flex items-center justify-center overflow-hidden">
											<input
												type="file"
												accept="image/*,application/pdf"
												className="absolute inset-0 opacity-0 cursor-pointer z-10"
												onChange={(e) =>
													handleMenuUpload(e.target.files?.[0] || null, i)
												}
											/>
											{item.url ? (
												item.fileType === "pdf" ? (
													<span className="text-[10px] uppercase font-bold text-text-muted">
														PDF
													</span>
												) : (
													<img
														src={item.url}
														className="w-full h-full object-cover"
													/>
												)
											) : (
												<span className="text-[10px] text-text-muted text-center px-1">
													Upload
												</span>
											)}
										</div>

										<div className="flex-1 space-y-2">
											<Input
												placeholder="Menu Name (e.g. Cocktails)"
												value={item.label || ""}
												onChange={(e) =>
													handleUpdateMenuItem(i, "label", e.target.value)
												}
												className="h-8 text-sm"
											/>
											<div className="flex items-center gap-2">
												{item.url && (
													<a
														href={item.url}
														target="_blank"
														className="text-[10px] text-events hover:underline truncate max-w-[150px]"
													>
														View File
													</a>
												)}
											</div>
										</div>

										<button
											onClick={() => handleRemoveMenuItem(i)}
											className="text-text-muted hover:text-destructive transition-colors p-1"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								))}

								{menuItems.length === 0 && (
									<div className="text-center py-8 border-2 border-dashed border-stroke/50 rounded-lg text-text-muted text-sm">
										No menus added yet.
									</div>
								)}
							</div>
						</div>
					</div>
				);

			case "venueInfo":
				const venueOverrides = localOverrides as any;

				// Ensure defaults for structured fields
				const hoursList: Array<{
					days: string;
					hours: string;
					is24Hours?: boolean;
				}> = Array.isArray(venueOverrides.operatingHours)
					? venueOverrides.operatingHours
					: typeof venueOverrides.operatingHours === "string"
						? // Try to parse legacy string if it looks like JSON, otherwise default
							[]
						: [];

				const handleAddHours = () => {
					const newHours = [
						...hoursList,
						{ days: "Mon - Fri", hours: "09:00 - 17:00" },
					];
					handleChange("operatingHours", newHours);
					handleSave("operatingHours", newHours);
				};

				const handleUpdateHours = (
					index: number,
					field: string,
					value: any,
				) => {
					const newHours = [...hoursList];
					newHours[index] = { ...newHours[index], [field]: value };
					handleChange("operatingHours", newHours);
					handleSave("operatingHours", newHours);
				};

				const handleRemoveHours = (index: number) => {
					const newHours = [...hoursList];
					newHours.splice(index, 1);
					handleChange("operatingHours", newHours);
					handleSave("operatingHours", newHours);
				};

				return (
					<div className="space-y-6">
						{/* Address Block */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<label className="text-xs font-medium text-text-muted uppercase tracking-wider">
									Location
								</label>
								<div className="flex items-center gap-2">
									{isCustom("addressStreet") || isCustom("addressCity") ? (
										<span className="text-[10px] font-bold text-events px-1.5 py-0.5 bg-events/10 rounded">
											Custom
										</span>
									) : (
										<span className="text-[10px] font-medium text-text-muted/50 px-1.5 py-0.5 bg-surface-2 rounded">
											Default
										</span>
									)}
								</div>
							</div>

							<div className="grid gap-3">
								<Input
									placeholder="Street Address (e.g. 123 Main St)"
									value={venueOverrides.addressStreet ?? ""}
									onChange={(e) =>
										handleChange("addressStreet", e.target.value)
									}
									onBlur={handleBlur}
									className="bg-surface"
								/>
								<div className="grid grid-cols-2 gap-3">
									<Input
										placeholder="City / Area"
										value={venueOverrides.addressCity ?? ""}
										onChange={(e) =>
											handleChange("addressCity", e.target.value)
										}
										onBlur={handleBlur}
										className="bg-surface"
									/>
									<Input
										placeholder="State"
										value={venueOverrides.addressState ?? ""}
										onChange={(e) =>
											handleChange("addressState", e.target.value)
										}
										onBlur={handleBlur}
										className="bg-surface"
									/>
								</div>
							</div>
						</div>

						<ControlWrapper
							label="Google Maps Link"
							isCustom={isCustom("mapLink")}
							onReset={() => handleReset("mapLink")}
						>
							<Input
								placeholder="https://maps.google.com/..."
								value={venueOverrides.mapLink ?? ""}
								onChange={(e) => handleChange("mapLink", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
							/>
						</ControlWrapper>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<label className="text-xs font-medium text-text-muted uppercase tracking-wider">
									Operating Hours
								</label>
								<Button
									variant="outline"
									size="sm"
									className="h-6 text-[10px] px-2"
									onClick={handleAddHours}
									text="Add Time Block"
								/>
							</div>

							<div className="space-y-3">
								{hoursList.map((block, i) => (
									<div
										key={i}
										className="bg-surface-2/30 p-2 rounded-lg border border-stroke space-y-2 relative group"
									>
										<button
											onClick={() => handleRemoveHours(i)}
											className="absolute top-2 right-2 text-text-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<X className="w-3 h-3" />
										</button>

										<div className="grid grid-cols-1 gap-2">
											<div>
												<label className="text-[10px] text-text-muted">
													Days Range
												</label>
												<Input
													value={block.days}
													onChange={(e) =>
														handleUpdateHours(i, "days", e.target.value)
													}
													placeholder="e.g. Mon - Fri"
													className="h-7 text-xs bg-surface"
												/>
											</div>

											<div className="flex items-center gap-2">
												<div className="flex-1">
													<label className="text-[10px] text-text-muted">
														Hours
													</label>
													<Input
														value={block.hours}
														onChange={(e) =>
															handleUpdateHours(i, "hours", e.target.value)
														}
														placeholder="e.g. 09:00 - 17:00"
														disabled={block.is24Hours}
														className="h-7 text-xs bg-surface"
													/>
												</div>
												<div className="pt-4">
													<label className="flex items-center gap-1 cursor-pointer">
														<input
															type="checkbox"
															checked={block.is24Hours || false}
															onChange={(e) =>
																handleUpdateHours(
																	i,
																	"is24Hours",
																	e.target.checked,
																)
															}
															className="rounded border-stroke text-events focus:ring-events"
														/>
														<span className="text-[10px] text-text-muted">
															24h
														</span>
													</label>
												</div>
											</div>
										</div>
									</div>
								))}

								{hoursList.length === 0 && (
									<div className="text-center py-4 border border-dashed border-stroke rounded bg-surface/50 text-xs text-text-muted">
										No hours set.
									</div>
								)}
							</div>
						</div>

						<div className="flex items-center justify-between p-3 rounded-lg border border-stroke bg-surface">
							<div className="space-y-0.5">
								<label className="text-sm font-medium text-text">
									Show Map
								</label>
							</div>
							<Switch
								checked={venueOverrides.showMap !== false}
								onCheckedChange={(checked) => {
									handleChange("showMap", checked);
									handleSave("showMap", checked);
								}}
							/>
						</div>
					</div>
				);

			case "gallery":
				const galleryOverrides = localOverrides as any;
				const currentImages = galleryOverrides.images || [];

				const handleGalleryUpload = async (
					file: File | null,
					index: number,
				) => {
					if (!file) return;

					// Create upload entry
					const uploadId = addUpload({
						type: "image",
						fileName: file.name,
						progress: 0,
						status: "uploading",
					});
					const upload = useUploadStore
						.getState()
						.uploads.find((u) => u.id === uploadId);
					const abortController = upload?.cancelController;

					try {
						// Using direct upload for progress
						const url = await uploadFileDirectCloudinary(
							file,
							{
								folder: `events/${templateId}/gallery`,
								tags: ["event", "gallery", templateId],
							},
							(progress) => {
								if (abortController?.signal.aborted)
									throw new Error("Cancelled");
								updateUpload(uploadId, { progress: Math.round(progress) });
							},
						);

						if (url) {
							const newImages = [...currentImages];
							newImages[index] = url; // Replace existing
							handleChange("images", newImages);
							handleSave("images", newImages);

							updateUpload(uploadId, { status: "completed", progress: 100 });
							setTimeout(() => removeUpload(uploadId), 3000);

							toast({
								title: "Image updated",
							});
						}
					} catch (error) {
						updateUpload(uploadId, {
							status: "error",
							error: error instanceof Error ? error.message : "Upload failed",
						});

						console.error("Gallery upload failed", error);
						toast({
							title: "Upload failed",
							variant: "destructive",
						});
					}
				};

				const handleGalleryAdd = async (files: FileList | null) => {
					if (!files || files.length === 0) return;

					const remainingSlots = 10 - currentImages.length;
					if (remainingSlots <= 0) {
						toast({
							title: "Gallery full",
							description: "Max 10 images allowed.",
						});
						return;
					}

					setUploading(true);
					const filesToUpload = Array.from(files).slice(0, remainingSlots);
					const newUrls: string[] = [];

					// Process uploads
					await Promise.all(
						filesToUpload.map(async (file) => {
							const uploadId = addUpload({
								type: "image",
								fileName: file.name,
								progress: 0,
								status: "uploading",
							});
							const upload = useUploadStore
								.getState()
								.uploads.find((u) => u.id === uploadId);
							const abortController = upload?.cancelController;

							try {
								const url = await uploadFileDirectCloudinary(
									file,
									{
										folder: `events/${templateId}/gallery`,
										tags: ["event", "gallery", templateId],
									},
									(progress) => {
										if (abortController?.signal.aborted)
											throw new Error("Cancelled");
										updateUpload(uploadId, { progress: Math.round(progress) });
									},
								);

								if (url) {
									newUrls.push(url);
									updateUpload(uploadId, {
										status: "completed",
										progress: 100,
									});
									setTimeout(() => removeUpload(uploadId), 3000);
								}
							} catch (e) {
								updateUpload(uploadId, {
									status: "error",
									error: e instanceof Error ? e.message : "Upload failed",
								});
								console.error("Upload error", e);
							}
						}),
					);

					if (newUrls.length > 0) {
						const updatedImages = [...currentImages, ...newUrls];
						handleChange("images", updatedImages);
						handleSave("images", updatedImages);
						toast({ title: `Added ${newUrls.length} images` });
					}
					setUploading(false);
				};

				const removeImage = (index: number) => {
					const newImages = [...currentImages];
					newImages.splice(index, 1);
					handleChange("images", newImages);
					handleSave("images", newImages);
				};

				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Section Title"
							isCustom={isCustom("title")}
							onReset={() => handleReset("title")}
						>
							<Input
								placeholder="e.g. Atmosphere"
								value={galleryOverrides.title ?? ""}
								onChange={(e) => handleChange("title", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface"
							/>
						</ControlWrapper>

						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<label className="text-sm font-medium text-text">
									Gallery Images
								</label>
								<span className="text-xs text-text-muted">
									{currentImages.length}/10
								</span>
							</div>

							<div className="grid grid-cols-2 gap-4">
								{/* Existing Images */}
								{currentImages.map((img: string, i: number) => (
									<div key={i} className="relative group aspect-square">
										<UploadImage
											text={`Image ${i + 1}`}
											value={null}
											onChange={(file) => handleGalleryUpload(file, i)}
											onlineImage={img}
											singleImage={true}
											className="w-full h-full"
										/>
										<button
											onClick={() => removeImage(i)}
											className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 shadow-md hover:bg-destructive transition-colors z-10"
											title="Remove image"
										>
											<X className="w-3 h-3" />
										</button>
									</div>
								))}

								{/* Add New Button (Multi-select) */}
								{currentImages.length < 10 && (
									<div className="aspect-square relative cursor-pointer border-2 border-dashed border-stroke rounded-2xl bg-surface hover:bg-surface-2 transition-colors flex flex-col items-center justify-center p-4">
										<input
											type="file"
											accept="image/*"
											multiple
											className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
											onChange={(e) => handleGalleryAdd(e.target.files)}
											disabled={uploading}
										/>
										<div className="flex flex-col items-center text-center space-y-2">
											{uploading ? (
												<div className="w-6 h-6 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
											) : (
												<div className="w-8 h-8 rounded-full bg-text-muted/10 flex items-center justify-center text-text-muted">
													<svg
														viewBox="0 0 24 24"
														fill="currentColor"
														className="w-5 h-5"
													>
														<path d="M5 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H5Zm7 3h2v3h3v2h-3v3h-2v-3H9V10h3V7Z" />
													</svg>
												</div>
											)}
											<span className="text-xs font-medium text-text-muted">
												{uploading ? "Uploading..." : "Add Images"}
											</span>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				);

			case "footer":
				const footOverrides = localOverrides as any;
				return (
					<div className="space-y-6">
						<ControlWrapper
							label="Disclaimer Text"
							isCustom={isCustom("disclaimerText")}
							onReset={() => handleReset("disclaimerText")}
						>
							<Textarea
								placeholder="e.g. 21+ Only. Please drink responsibly."
								value={footOverrides.disclaimerText ?? ""}
								onChange={(e) => handleChange("disclaimerText", e.target.value)}
								onBlur={handleBlur}
								className="bg-surface h-20"
							/>
						</ControlWrapper>
						<p className="text-xs text-text-muted">
							Email and Phone are pulled from your organizer profile settings.
						</p>
					</div>
				);

			default:
				return (
					<div className="p-4 text-center text-text-muted text-sm">
						No editable fields for this section yet.
					</div>
				);
		}
	};

	return (
		<div className="h-full flex flex-col bg-surface border-l border-stroke">
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-stroke shrink-0">
				<span className="font-heading font-semibold text-sm">Edit Section</span>
				<div className="flex items-center gap-2">
					{/* Status Indicators */}
					{(isSaving || uploading) && (
						<span className="text-xs text-text-muted animate-pulse flex items-center gap-1 mr-2">
							<RotateCw className="w-3 h-3 animate-spin" />
							{uploading ? "Uploading..." : "Saving..."}
						</span>
					)}
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0"
					>
						<X className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{/* LIVE PREVIEW BLOCK */}
			<div className="bg-bg border-b border-stroke overflow-hidden flex-shrink-0 max-h-[40vh] overflow-y-auto">
				{renderPreview()}
			</div>

			{/* Fields */}
			<div className="flex-1 overflow-y-auto p-4">{renderFields()}</div>

			{/* Footer */}
			<div className="p-4 border-t border-stroke bg-surface-2/50 shrink-0">
				<div className="flex justify-end gap-2">
					<Button
						text="Done"
						size="sm"
						className="bg-events"
						onClick={onClose}
						disabled={isSaving}
					/>
				</div>
			</div>
		</div>
	);
}
