"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { slugify } from "@/lib/utils";
import { uploadFileGetURL } from "@/lib/storage/upload";
import { uploadImageCloudinary } from "@/lib/storage/cloudinary";
import {
	fetchEventById,
	updateEvent,
	isEventSlugTaken,
} from "@/lib/firebase/queries/event";
import { eventDetailsSchema } from "@/lib/models/event.schema";
import { z, ZodError } from "zod";
import countriesJson from "@/data/countries_and_states.json";
import { TIMEZONES } from "@/lib/constants/location";

// Types for the JSON
type RawState = { name: string; state_code?: string };
type RawCountry = {
	name: string;
	iso3?: string;
	iso2?: string;
	states: RawState[];
};
type CountriesPayload = {
	error?: boolean;
	msg?: string;
	data: RawCountry[];
};

// Map Zod error paths to simple, concise English messages
function getSimpleErrorMessage(error: ZodError): string {
	const firstError = error.issues[0];
	const path = firstError?.path?.join(".") || "";
	const msg = firstError?.message || "";

	// Custom mapping for known fields
	switch (path) {
		case "title":
			return "Title is required and must be at least 3 characters.";
		case "slug":
			return "Slug must be at least 3 characters.";
		case "description":
			return "Description must be at least 50 characters.";
		case "coverImageURL":
			return "Please upload a valid cover image.";
		case "startAt":
			return "Please enter a valid start date and time.";
		case "endAt":
			return "Please enter a valid end date and time.";
		case "venue.name":
			return "Venue name must be at least 2 characters.";
		case "venue.address":
			return "Venue address must be at least 3 characters.";
		case "venue.city":
			return "Venue city is optional.";
		case "venue.state":
			return "Venue state must be at least 2 characters.";
		case "venue.country":
			return "Venue country is required.";
		case "capacityTotal":
			return "Capacity must be at least 1.";
		case "frequency":
			return "Please select a frequency for recurring events.";
		case "recurringEndMode":
			return "Please select how the recurring event should end.";
		case "recurringEndDate":
			return "Please select an end date for the recurring event.";
		case "recurringEndOccurrences":
			return "Please enter a valid number of occurrences (at least 1).";
		default:
			// Fallback for unknown fields
			if (msg.toLowerCase().includes("required"))
				return "Please fill all required fields.";
			return "Please check your input and try again.";
	}
}

// Simple Modal component for error popups
function ErrorModal({
	open,
	message,
	onClose,
}: {
	open: boolean;
	message: string;
	onClose: () => void;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="bg-surface rounded-xl shadow-lg p-6 max-w-xs w-full">
				<div className="text-alert text-base mb-4">{message}</div>
				<div className="flex justify-end">
					<Button text="Close" variant="cta" onClick={onClose} />
				</div>
			</div>
		</div>
	);
}

type FormValues = z.input<typeof eventDetailsSchema>; // strings from inputs

export default function EditEventDetailsPage() {
	const router = useRouter();
	const { eventId } = useParams<{ eventId: string }>();
	const eventIdString = eventId as string;

	// Build countries and states data - only specific countries
	const { COUNTRY_LIST, COUNTRY_TO_STATES } = useMemo(() => {
		const payload = countriesJson as CountriesPayload;
		const allowedCountries = [
			"Nigeria",
			//"United States",
			//"United Kingdom",
			"Ghana",
			//"South Africa",
			//"Canada",
		];

		const filteredData = (payload.data ?? []).filter((c) =>
			allowedCountries.includes(c.name)
		);

		const list = filteredData.map((c) => c.name);
		const map: Record<string, string[]> = {};
		for (const c of filteredData) {
			map[c.name] = (c.states ?? [])
				.map((s) => s?.name)
				.filter(Boolean) as string[];
		}
		return { COUNTRY_LIST: list, COUNTRY_TO_STATES: map };
	}, []);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);
	const [event, setEvent] = useState<any | null>(null);

	const [v, setV] = useState<FormValues>({
		title: "",
		slug: "",
		description: "",
		coverImageURL: "",
		startAt: "",
		endAt: "",
		timezone:
			Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos",
		venue: { name: "", address: "", city: "", state: "", country: "" },
		capacityMode: "limited",
		capacityTotal: 100,
		visibility: "public",
		isRecurring: false,
		frequency: undefined,
		recurringEndMode: undefined,
		recurringEndDate: "",
		recurringEndOccurrences: undefined,
	});
	const [capacityInput, setCapacityInput] = useState<string>("100");
	const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

	// For cover image upload
	const [coverFile, setCoverFile] = useState<File | null>(null);
	const [coverPreview, setCoverPreview] = useState<string>("");

	const states = v.venue.country
		? COUNTRY_TO_STATES[v.venue.country] ?? []
		: [];

	// Fetch event data on mount
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const eventData = await fetchEventById(eventIdString);
				if (!mounted) return;

				if (!eventData) {
					router.push("/events");
					return;
				}

				setEvent(eventData);

				// Convert Firestore Timestamps to local datetime strings for datetime-local inputs

				const convertToLocalDateTime = (date: any) => {
					if (!date) return "";
					let dateObj: Date;
					if (date instanceof Date) {
						dateObj = date;
					} else if (date?.toDate) {
						dateObj = date.toDate();
					} else {
						return "";
					}

					// Convert to local timezone and format for datetime-local input
					const year = dateObj.getFullYear();
					const month = String(dateObj.getMonth() + 1).padStart(2, "0");
					const day = String(dateObj.getDate()).padStart(2, "0");
					const hours = String(dateObj.getHours()).padStart(2, "0");
					const minutes = String(dateObj.getMinutes()).padStart(2, "0");

					return `${year}-${month}-${day}T${hours}:${minutes}`;
				};

				const startAt = convertToLocalDateTime(eventData.startAt);
				const endAt = convertToLocalDateTime(eventData.endAt);
				console.log(eventData);

				// Convert recurring end date to local date string if it exists
				const convertRecurringEndDate = (date: any) => {
					if (!date) return "";
					let dateObj: Date;
					if (date instanceof Date) {
						dateObj = date;
					} else if (date?.toDate) {
						dateObj = date.toDate();
					} else {
						return "";
					}
					const year = dateObj.getFullYear();
					const month = String(dateObj.getMonth() + 1).padStart(2, "0");
					const day = String(dateObj.getDate()).padStart(2, "0");
					return `${year}-${month}-${day}`;
				};

				// Populate form with existing data
				setV({
					title: eventData.title || "",
					slug: eventData.slug || "",
					description: eventData.description || "",
					coverImageURL: eventData.coverImageURL || "",
					startAt,
					endAt,
					timezone:
						eventData.timezone ||
						Intl.DateTimeFormat().resolvedOptions().timeZone ||
						"Africa/Lagos",
					venue: {
						name: eventData.venue?.name || "",
						address: eventData.venue?.address || "",
						city: eventData.venue?.city || "",
						state: eventData.venue?.state || "",
						country: eventData.venue?.country || "",
					},
					capacityMode: eventData.capacityMode || "limited",
					capacityTotal: eventData.capacityTotal || 100,
					visibility: eventData.visibility || "public",
					isRecurring: eventData.isRecurring || false,
					frequency: eventData.frequency || undefined,
					recurringEndMode: eventData.recurringEndMode || undefined,
					recurringEndDate: convertRecurringEndDate(eventData.recurringEndDate),
					recurringEndOccurrences:
						eventData.recurringEndOccurrences || undefined,
				});

				// If slug exists in the event data, it means it was manually set, so mark it as edited
				if (eventData.slug) {
					setIsSlugManuallyEdited(true);
				}

				setCapacityInput(eventData.capacityTotal?.toString() || "100");

				// Set initial cover preview from existing event data
				// The useEffect will handle showing file preview if user picks a new file
				setCoverPreview(eventData.coverImageURL || "");
				console.log(eventData);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [eventIdString, router]);

	// Auto-generate slug from title only if user hasn't manually edited it
	useEffect(() => {
		if (!v.title || isSlugManuallyEdited) return;
		setV((prev) => ({ ...prev, slug: slugify(prev.title) }));
	}, [v.title, isSlugManuallyEdited]);

	// Handle coverPreview: show picked file if present, else show URL if present
	useEffect(() => {
		if (coverFile) {
			// If user picked a new file, show file preview
			const url = URL.createObjectURL(coverFile);
			setCoverPreview(url);
			return () => URL.revokeObjectURL(url);
		} else {
			// If no file picked, show the URL from form data
			setCoverPreview(v.coverImageURL || "");
		}
	}, [coverFile, v.coverImageURL]);

	// Calculate end date from occurrences
	const calculatedEndDate = useMemo(() => {
		if (
			!v.isRecurring ||
			v.recurringEndMode !== "occurrences" ||
			!v.recurringEndOccurrences ||
			!v.startAt ||
			!v.frequency
		) {
			return null;
		}

		try {
			if (!v.startAt || typeof v.startAt !== "string") return null;
			const startDate = new Date(v.startAt);
			if (isNaN(startDate.getTime())) return null;

			const occurrences = v.recurringEndOccurrences;
			const endDate = new Date(startDate);

			switch (v.frequency) {
				case "daily":
					endDate.setDate(endDate.getDate() + (occurrences - 1));
					break;
				case "weekly":
					endDate.setDate(endDate.getDate() + (occurrences - 1) * 7);
					break;
				case "biweekly":
					endDate.setDate(endDate.getDate() + (occurrences - 1) * 14);
					break;
				case "monthly":
					endDate.setMonth(endDate.getMonth() + (occurrences - 1));
					break;
				default:
					return null;
			}

			return endDate;
		} catch {
			return null;
		}
	}, [
		v.isRecurring,
		v.recurringEndMode,
		v.recurringEndOccurrences,
		v.startAt,
		v.frequency,
	]);

	const canSave = useMemo(() => {
		try {
			// Update capacityTotal from the string input
			const capacityTotal =
				v.capacityMode === "limited" && capacityInput
					? parseInt(capacityInput)
					: v.capacityMode === "unlimited"
					? null
					: 1;

			// Additional checks for capacity input
			if (
				v.capacityMode === "limited" &&
				(!capacityInput || parseInt(capacityInput) < 1)
			) {
				return false;
			}

			// Convert datetime strings to Date objects for validation (same as saveChanges)
			const convertLocalToTimezone = (localDateTime: string) => {
				if (!localDateTime) return null;
				const localDate = new Date(localDateTime);
				const utcTime =
					localDate.getTime() + localDate.getTimezoneOffset() * 60000;
				return new Date(utcTime);
			};

			// Validate the complete form data with proper date conversions
			eventDetailsSchema.parse({
				...v,
				capacityTotal,
				coverImageURL: coverPreview || v.coverImageURL,
				startAt: v.startAt
					? convertLocalToTimezone(v.startAt as string)
					: undefined,
				// For recurring events, endAt should be undefined/null
				endAt: v.isRecurring
					? undefined
					: v.endAt
					? convertLocalToTimezone(v.endAt as string)
					: undefined,
				recurringEndDate:
					v.isRecurring && v.recurringEndMode === "date" && v.recurringEndDate
						? new Date(v.recurringEndDate + "T00:00:00")
						: undefined,
			});

			return true;
		} catch {
			return false;
		}
	}, [v, capacityInput, coverPreview]);

	const onPickCover: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
		const f = e.target.files?.[0];
		if (!f) return;
		if (f.size > 2 * 1024 * 1024)
			return setErr("Cover image must be 2MB or less.");
		setErr(null);
		setCoverFile(f);
		// Clear any previous URL when user picks a new file
		setV((prev) => ({ ...prev, coverImageURL: "" }));
	};

	async function saveChanges() {
		if (!event) return;

		try {
			setSaving(true);
			setErr(null);

			// Check if slug is already taken (excluding current event) and suggest alternative if needed
			let finalSlug = v.slug;
			let slugTaken = await isEventSlugTaken(finalSlug, eventIdString);

			if (slugTaken) {
				// If user manually edited the slug, don't auto-suggest alternatives
				if (isSlugManuallyEdited) {
					throw new Error(
						`The URL "events.labeld.app/${v.slug}" is already taken. Please choose a different custom URL.`
					);
				}

				// Try to find an available slug by adding a number suffix (only for auto-generated slugs)
				let counter = 1;
				do {
					finalSlug = `${v.slug}-${counter}`;
					slugTaken = await isEventSlugTaken(finalSlug, eventIdString);
					counter++;
				} while (slugTaken && counter <= 100); // Prevent infinite loop

				if (slugTaken) {
					throw new Error(
						"This event URL is already taken. Please try a different title or use a custom URL."
					);
				}

				// Update the form with the available slug
				setV((prev) => ({ ...prev, slug: finalSlug }));
			}

			// Validate form data BEFORE any Firebase operations
			const capacityTotal =
				v.capacityMode === "limited" && capacityInput
					? parseInt(capacityInput)
					: v.capacityMode === "unlimited"
					? null
					: 1;

			// Convert local datetime strings to Date objects in the selected timezone
			const convertLocalToTimezone = (localDateTime: string) => {
				if (!localDateTime) return null;

				// Create a date object from the local datetime string
				const localDate = new Date(localDateTime);

				// Convert to the selected timezone
				const utcTime =
					localDate.getTime() + localDate.getTimezoneOffset() * 60000;
				const targetTime = new Date(utcTime);

				return targetTime;
			};

			// If a new cover file is selected, upload it first
			let finalCoverImageURL = v.coverImageURL;
			if (coverFile) {
				try {
					// Primary: Upload to Cloudinary
					finalCoverImageURL = await uploadImageCloudinary(coverFile, {
						folder: `events/covers`,
						tags: ["event", "cover"],
					});
					console.log(
						"✅ Event cover uploaded to Cloudinary:",
						finalCoverImageURL
					);
				} catch (cloudinaryError) {
					// Fallback: Upload to Firebase Storage
					console.warn(
						"⚠️ Cloudinary upload failed, falling back to Firebase Storage:",
						cloudinaryError
					);
					finalCoverImageURL = await uploadFileGetURL(
						coverFile,
						`events/covers/${crypto.randomUUID()}-${coverFile.name}`
					);
					console.log(
						"✅ Event cover uploaded to Firebase Storage:",
						finalCoverImageURL
					);
				}
			}

			// Validate the complete form data with the final cover image URL and slug
			const parsed = eventDetailsSchema.parse({
				...v,
				slug: finalSlug,
				startAt: convertLocalToTimezone(v.startAt as string),
				// For recurring events, endAt should be undefined/null
				endAt: v.isRecurring
					? undefined
					: v.endAt
					? convertLocalToTimezone(v.endAt as string)
					: undefined,
				capacityTotal,
				coverImageURL: finalCoverImageURL,
				isRecurring: v.isRecurring || false,
				frequency: v.isRecurring ? v.frequency : undefined,
				recurringEndMode: v.isRecurring ? v.recurringEndMode : undefined,
				recurringEndDate:
					v.isRecurring && v.recurringEndMode === "date" && v.recurringEndDate
						? new Date(v.recurringEndDate + "T00:00:00")
						: undefined,
				recurringEndOccurrences:
					v.isRecurring && v.recurringEndMode === "occurrences"
						? v.recurringEndOccurrences
						: undefined,
			});

			// Additional validation for capacity input
			if (
				v.capacityMode === "limited" &&
				(!capacityInput || parseInt(capacityInput) < 1)
			) {
				throw new Error(
					"Capacity must be at least 1 when limited mode is selected."
				);
			}

			const finalCapacityTotal =
				parsed.capacityMode === "unlimited" ? null : parsed.capacityTotal!;

			// Filter out undefined values - Firestore doesn't accept undefined
			const updateData: Record<string, any> = {
				...parsed,
				capacityTotal: finalCapacityTotal,
			};

			// Remove undefined fields
			Object.keys(updateData).forEach((key) => {
				if (updateData[key] === undefined) {
					delete updateData[key];
				}
			});

			// Update the event
			await updateEvent(eventIdString, updateData);

			// Navigate back to event dashboard
			router.push(`/events/${eventIdString}`);
		} catch (e: any) {
			if (e instanceof ZodError) {
				setErr(getSimpleErrorMessage(e));
			} else {
				setErr(e?.message ?? "Failed to update event.");
			}
			return;
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-2xl mx-auto">
				<div className="min-h-dvh grid place-items-center">
					<Spinner size="lg" />
				</div>
			</div>
		);
	}

	if (!event) {
		return (
			<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-2xl mx-auto">
				<div className="min-h-dvh grid place-items-center p-6 text-center">
					<div>
						<p className="text-text-muted">Event not found.</p>
						<div className="mt-4">
							<Button
								text="Back to Events"
								variant="outline"
								onClick={() => router.push("/events")}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<ErrorModal
				open={!!err}
				message={err || ""}
				onClose={() => setErr(null)}
			/>
			<div className="min-h-dvh px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-2xl mx-auto pb-24">
				{/* Header */}
				<div className="mt-2 sm:mt-4 lg:mt-6 mb-3 sm:mb-4">
					<h1 className="font-heading font-semibold text-xl sm:text-2xl">
						Edit Event Details
					</h1>
					<p className="text-text-muted text-sm sm:text-base mt-1">
						Update your event information. Changes will be saved immediately.
					</p>
				</div>

				{/* Grouped Card Containers */}
				<div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4 lg:gap-6">
					{/* Event Info */}
					<div className="rounded-xl sm:rounded-2xl bg-surface border border-stroke p-4 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5">
						<div>
							<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
								Title <span className="text-cta">*</span>
							</label>
							<input
								value={v.title}
								onChange={(e) =>
									setV((prev) => ({ ...prev, title: e.target.value }))
								}
								className="w-full rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent"
								placeholder="e.g Labeld Nights: Live in Lagos"
							/>
						</div>
						<div>
							<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
								Use custom URL
							</label>
							<div className="flex items-center gap-2">
								<span className="text-xs sm:text-sm text-text-muted whitespace-nowrap">
									events.labeld.app/
								</span>
								<input
									type="text"
									value={v.slug || ""}
									onChange={(e) => {
										const newSlug = slugify(e.target.value);
										setV((prev) => ({ ...prev, slug: newSlug }));
										setIsSlugManuallyEdited(true);
									}}
									className="flex-1 rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent"
									placeholder="custom-url"
									pattern="[a-z0-9-]+"
									title="Only lowercase letters, numbers, and hyphens are allowed"
								/>
							</div>
							<p className="text-xs text-text-muted mt-1">
								Special characters like &^%$_# are not allowed
							</p>
						</div>
						<div>
							<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
								Description <span className="text-cta">*</span>
							</label>
							<textarea
								rows={4}
								value={v.description}
								onChange={(e) =>
									setV((prev) => ({ ...prev, description: e.target.value }))
								}
								className="w-full rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent resize-none"
								placeholder="Tell people what this event is about, who's performing, etc."
							/>
						</div>
					</div>

					{/* Cover Image */}
					<div className="rounded-xl sm:rounded-2xl bg-surface border border-stroke p-4 sm:p-5 lg:p-6">
						<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
							Cover image <span className="text-cta">*</span>
						</label>

						{coverPreview ? (
							<div className="relative w-full aspect-video sm:aspect-[16/10] lg:max-h-[50vh] overflow-hidden rounded-lg sm:rounded-xl border border-stroke mb-3">
								<OptimizedImage
									src={coverPreview}
									alt="Cover preview"
									fill
									sizeContext="card"
									objectFit="cover"
									className="w-full"
								/>
							</div>
						) : null}

						<input
							type="file"
							accept="image/*"
							onChange={onPickCover}
							className="block w-full text-xs sm:text-sm text-text file:mr-2 sm:file:mr-3 file:rounded-lg file:border file:border-stroke file:bg-bg file:px-2 sm:file:px-3 file:py-1.5 sm:file:py-2 file:text-xs sm:file:text-sm file:font-semibold hover:file:bg-surface"
						/>
						<p className="text-xs text-text-muted mt-2">
							Upload a cover image for your event. Recommended: 1:1 aspect
							ratio, JPG/PNG/WebP, max 2MB.
						</p>
					</div>

					{/* Date & Time */}
					<div className="rounded-xl sm:rounded-2xl bg-surface border border-stroke p-4 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5">
						<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
							<div>
								<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
									Start <span className="text-cta">*</span>
								</label>
								<input
									type="datetime-local"
									value={v.startAt as unknown as string}
									onChange={(e) =>
										setV((prev) => ({ ...prev, startAt: e.target.value }))
									}
									className="w-full rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent"
								/>
							</div>
							{!v.isRecurring && (
								<div>
									<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
										End <span className="text-cta">*</span>
									</label>
									<input
										type="datetime-local"
										value={v.endAt as unknown as string}
										onChange={(e) =>
											setV((prev) => ({ ...prev, endAt: e.target.value }))
										}
										className="w-full rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
								Timezone <span className="text-cta">*</span>
							</label>
							<select
								value={v.timezone}
								onChange={(e) =>
									setV((prev) => ({ ...prev, timezone: e.target.value }))
								}
								className="w-full rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent bg-surface"
							>
								{TIMEZONES.map((tz) => (
									<option key={tz.value} value={tz.value}>
										{tz.label}
									</option>
								))}
							</select>
						</div>

						{/* Recurring Event */}
						<div className="pt-4 border-t border-stroke flex flex-col gap-4 sm:gap-5">
							<div className="flex items-center gap-3">
								<input
									type="checkbox"
									id="isRecurring"
									checked={v.isRecurring || false}
									onChange={(e) =>
										setV((prev) => ({
											...prev,
											isRecurring: e.target.checked,
											frequency: e.target.checked
												? prev.frequency || "weekly"
												: undefined,
											recurringEndMode: e.target.checked
												? prev.recurringEndMode || "occurrences"
												: undefined,
											recurringEndDate: e.target.checked
												? prev.recurringEndDate
												: "",
											recurringEndOccurrences: e.target.checked
												? prev.recurringEndOccurrences
												: undefined,
											// Clear endAt when recurring is enabled
											endAt: e.target.checked ? "" : prev.endAt,
										}))
									}
									className="w-4 h-4 rounded border-stroke text-accent focus:ring-accent focus:ring-2"
								/>
								<label
									htmlFor="isRecurring"
									className="text-xs sm:text-sm text-text cursor-pointer"
								>
									This is a recurring event
								</label>
							</div>
							{v.isRecurring && (
								<>
									<div>
										<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
											Event frequency <span className="text-cta">*</span>
										</label>
										<select
											value={v.frequency || ""}
											onChange={(e) =>
												setV((prev) => ({
													...prev,
													frequency: e.target.value as
														| "daily"
														| "weekly"
														| "biweekly"
														| "monthly",
												}))
											}
											className="w-full rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-surface text-text outline-none focus:border-accent"
										>
											<option value="">Select frequency</option>
											<option value="daily">Every day</option>
											<option value="weekly">Every week</option>
											<option value="biweekly">Every two weeks</option>
											<option value="monthly">Every month</option>
										</select>
									</div>
									<div>
										<label className="block text-xs sm:text-sm text-text-muted mb-2 sm:mb-3">
											When does your event end?{" "}
											<span className="text-cta">*</span>
										</label>
										<div className="flex flex-col gap-3 sm:gap-4">
											<div className="flex items-center gap-3">
												<input
													type="radio"
													id="recurringEndDate"
													name="recurringEndMode"
													checked={v.recurringEndMode === "date"}
													onChange={() =>
														setV((prev) => ({
															...prev,
															recurringEndMode: "date",
															recurringEndOccurrences: undefined,
														}))
													}
													className="w-4 h-4 border-stroke text-accent focus:ring-accent focus:ring-2"
												/>
												<label
													htmlFor="recurringEndDate"
													className="text-xs sm:text-sm text-text cursor-pointer flex items-center gap-2"
												>
													<span>On</span>
													<input
														type="date"
														value={v.recurringEndDate as unknown as string}
														onChange={(e) =>
															setV((prev) => ({
																...prev,
																recurringEndDate: e.target.value,
															}))
														}
														disabled={v.recurringEndMode !== "date"}
														className="flex-1 rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-text outline-none focus:border-accent disabled:bg-stroke/30 disabled:cursor-not-allowed"
													/>
												</label>
											</div>
											<div className="flex items-center gap-3">
												<input
													type="radio"
													id="recurringEndOccurrences"
													name="recurringEndMode"
													checked={v.recurringEndMode === "occurrences"}
													onChange={() =>
														setV((prev) => ({
															...prev,
															recurringEndMode: "occurrences",
															recurringEndDate: "",
														}))
													}
													className="w-4 h-4 border-stroke text-accent focus:ring-accent focus:ring-2"
												/>
												<label
													htmlFor="recurringEndOccurrences"
													className="text-xs sm:text-sm text-text cursor-pointer flex items-center gap-2"
												>
													<span>After</span>
													<input
														type="number"
														min={1}
														value={v.recurringEndOccurrences || ""}
														onChange={(e) =>
															setV((prev) => ({
																...prev,
																recurringEndOccurrences: e.target.value
																	? parseInt(e.target.value)
																	: undefined,
															}))
														}
														disabled={v.recurringEndMode !== "occurrences"}
														className="w-20 sm:w-24 rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-text outline-none focus:border-accent disabled:bg-stroke/30 disabled:cursor-not-allowed"
													/>
													<span>occurrences</span>
												</label>
											</div>
										</div>
										{calculatedEndDate && v.recurringEndOccurrences && (
											<div className="mt-2 pt-3 border-t border-stroke">
												<div className="text-xs sm:text-sm text-text-muted space-y-1">
													<div>
														{v.recurringEndOccurrences === 1
															? "1 date"
															: `${v.recurringEndOccurrences} dates`}
													</div>
													<div>
														Starting on{" "}
														{typeof v.startAt === "string" &&
															new Date(v.startAt).toLocaleDateString("en-US", {
																month: "long",
																day: "numeric",
																year: "numeric",
															})}
														. Ending{" "}
														{calculatedEndDate.toLocaleDateString("en-US", {
															month: "long",
															day: "numeric",
															year: "numeric",
														})}
														.
													</div>
												</div>
											</div>
										)}
									</div>
								</>
							)}
						</div>
					</div>

					{/* Venue */}
					<div className="rounded-xl sm:rounded-2xl bg-surface border border-stroke p-4 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5">
						<fieldset>
							<legend className="px-1 text-xs sm:text-sm text-text-muted mb-2">
								Venue <span className="text-cta">*</span>
							</legend>
							<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
								<input
									className="rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent"
									placeholder="Venue name"
									value={v.venue.name}
									onChange={(e) =>
										setV((p) => ({
											...p,
											venue: { ...p.venue, name: e.target.value },
										}))
									}
								/>
								<input
									className="rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent"
									placeholder="Address"
									value={v.venue.address}
									onChange={(e) =>
										setV((p) => ({
											...p,
											venue: { ...p.venue, address: e.target.value },
										}))
									}
								/>
								<select
									className="rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent bg-surface"
									value={v.venue.state}
									onChange={(e) =>
										setV((p) => ({
											...p,
											venue: { ...p.venue, state: e.target.value },
										}))
									}
									disabled={!v.venue.country}
								>
									<option value="">
										{v.venue.country ? "Select state" : "Select country first"}
									</option>
									{states.map((s, idx) => (
										<option key={`${v.venue.country}-${s}-${idx}`} value={s}>
											{s}
										</option>
									))}
								</select>
								<select
									className="rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent bg-surface"
									value={v.venue.country}
									onChange={(e) => {
										setV((p) => ({
											...p,
											venue: { ...p.venue, country: e.target.value, state: "" },
										}));
									}}
								>
									<option value="">Choose your country</option>
									{COUNTRY_LIST.map((c, idx) => (
										<option key={`${c}-${idx}`} value={c}>
											{c}
										</option>
									))}
								</select>
							</div>
						</fieldset>
					</div>

					{/* Capacity & Visibility */}
					<div className="rounded-xl sm:rounded-2xl bg-surface border border-stroke p-4 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5">
						<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
							<div>
								<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
									Capacity mode <span className="text-cta">*</span>
								</label>
								<select
									value={v.capacityMode}
									onChange={(e) => {
										const mode = e.target.value as "limited" | "unlimited";
										setV((prev) => ({
											...prev,
											capacityMode: mode,
											capacityTotal:
												mode === "unlimited" ? null : prev.capacityTotal || 100,
										}));
									}}
									className="w-full rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-surface text-text outline-none focus:border-accent"
								>
									<option value="limited">Limited</option>
									<option value="unlimited">Unlimited</option>
								</select>
							</div>
							{v.capacityMode === "limited" && (
								<div>
									<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
										Capacity (when limited) <span className="text-cta">*</span>
									</label>
									<input
										type="number"
										min={1}
										value={capacityInput}
										onChange={(e) => setCapacityInput(e.target.value)}
										className="w-full rounded-lg sm:rounded-xl border border-stroke px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text outline-none focus:border-accent"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-xs sm:text-sm text-text-muted mb-1.5 sm:mb-2">
								Visibility <span className="text-cta">*</span>
							</label>
							<div className="flex flex-wrap gap-2 sm:gap-3">
								{(["public", "unlisted"] as const).map((val) => (
									<button
										key={val}
										type="button"
										onClick={() =>
											setV((prev) => ({ ...prev, visibility: val }))
										}
										className={[
											"px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-full border transition-colors",
											v.visibility === val
												? "border-accent text-accent bg-accent/10"
												: "border-stroke text-text hover:border-accent/50",
										].join(" ")}
									>
										{val[0].toUpperCase() + val.slice(1)}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="fixed inset-x-0 bottom-0 bg-bg/80 backdrop-blur border-t border-stroke px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between max-w-2xl mx-auto">
					<Button
						text="Cancel"
						variant="outline"
						onClick={() => router.push(`/events/${eventIdString}`)}
						outlineColor="text-text-muted"
						className="!text-sm sm:!text-base !px-3 sm:!px-4 !py-2 sm:!py-2.5"
					/>
					<Button
						text={saving ? "Saving…" : "Save Changes"}
						variant={canSave && !err ? "primary" : "disabled"}
						disabled={!canSave || saving || !!err}
						onClick={saveChanges}
						className="!text-sm sm:!text-base !px-3 sm:!px-4 !py-2 sm:!py-2.5"
					/>
				</div>
			</div>
		</>
	);
}
