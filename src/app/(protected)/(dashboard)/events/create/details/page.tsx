"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import Stepper from "@/components/ticketing/Stepper";
import { slugify } from "@/lib/utils";
import { uploadFileGetURL } from "@/lib/storage/upload";
import { uploadImageCloudinary } from "@/lib/storage/cloudinary";
import {
	createEventDraft,
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
			return "Description is required.";
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

const STEPS = [
	{ key: "details", label: "Details" },
	// { key: "theme", label: "Theme" },
	{ key: "tickets", label: "Tickets" },
	{ key: "merch", label: "Merch", optional: true },
	{ key: "moments", label: "Moments", optional: true },
	{ key: "review", label: "Review" },
];

export default function EventDetailsPage() {
	const router = useRouter();
	const auth = getAuth();

	// Build countries and states data - only specific countries
	const { COUNTRY_LIST, COUNTRY_TO_STATES } = useMemo(() => {
		const payload = countriesJson as CountriesPayload;
		const allowedCountries = [
			"Nigeria",
			//"United States",
			//"United Kingdom",
			// "Ghana",
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
	});
	const [capacityInput, setCapacityInput] = useState<string>("100");
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	// For cover image upload
	const [coverFile, setCoverFile] = useState<File | null>(null);
	const [coverPreview, setCoverPreview] = useState<string>("");

	const states = v.venue.country
		? COUNTRY_TO_STATES[v.venue.country] ?? []
		: [];

	useEffect(() => {
		if (!v.title) return;
		setV((prev) => ({ ...prev, slug: slugify(prev.title) }));
	}, [v.title]);

	// When coverFile changes, update coverPreview
	useEffect(() => {
		if (!coverFile) {
			setCoverPreview(v.coverImageURL || "");
			return;
		}
		const url = URL.createObjectURL(coverFile);
		setCoverPreview(url);
		return () => URL.revokeObjectURL(url);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [coverFile]);

	const canContinue = useMemo(() => {
		try {
			// Update capacityTotal from the string input
			const capacityTotal =
				v.capacityMode === "limited" && capacityInput
					? parseInt(capacityInput)
					: v.capacityMode === "unlimited"
					? null
					: 1;

			// Validate the complete form data
			eventDetailsSchema.parse({
				...v,
				capacityTotal,
				coverImageURL: coverPreview,
			});

			// Additional checks for capacity input
			if (
				v.capacityMode === "limited" &&
				(!capacityInput || parseInt(capacityInput) < 1)
			) {
				return false;
			}

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
	};

	async function saveAndGo() {
		const uid = auth.currentUser?.uid;
		if (!uid) return router.push("/");

		try {
			setSaving(true);
			setErr(null);

			// Check if slug is already taken and suggest alternative if needed
			let finalSlug = v.slug;
			let slugTaken = await isEventSlugTaken(finalSlug);

			if (slugTaken) {
				// Try to find an available slug by adding a number suffix
				let counter = 1;
				do {
					finalSlug = `${v.slug}-${counter}`;
					slugTaken = await isEventSlugTaken(finalSlug);
					counter++;
				} while (slugTaken && counter <= 100); // Prevent infinite loop

				if (slugTaken) {
					throw new Error(
						"This event URL is already taken. Please try a different title."
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

			// If a new cover file is selected, upload it first
			let finalCoverImageURL = v.coverImageURL;
			if (coverFile) {
				try {
					// Primary: Upload to Cloudinary
					finalCoverImageURL = await uploadImageCloudinary(coverFile, {
						folder: `events/covers`,
						tags: ["event", "cover", uid],
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
				capacityTotal,
				coverImageURL: finalCoverImageURL,
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

			const id = await createEventDraft({
				...parsed,
				capacityTotal: finalCapacityTotal,
				createdBy: uid,
				status: "draft",
			} as any);

			router.push(`/events/${id}/tickets`);
		} catch (e: any) {
			if (e instanceof ZodError) {
				setErr(getSimpleErrorMessage(e));
			} else {
				setErr(e?.message ?? "Failed to save event.");
			}
			// Don't proceed to next page if there's an error
			return;
		} finally {
			setSaving(false);
		}
	}

	return (
		<>
			<ErrorModal
				open={!!err}
				message={err || ""}
				onClose={() => setErr(null)}
			/>
			<div className="min-h-dvh px-4 sm:px-6 py-8 max-w-2xl mx-auto">
				<Stepper steps={STEPS} activeKey="details" />

				<h1 className="mt-6 font-heading font-semibold text-2xl">
					Event Details
				</h1>
				<p className="text-text-muted mt-1">
					Add the essentials. You can tweak the theme, tickets, merch and
					moments next.
				</p>

				{/* Grouped Card Containers */}
				<div className="mt-6 flex flex-col gap-6">
					{/* Event Info */}
					<div className="rounded-2xl bg-surface border border-stroke p-6 flex flex-col gap-5">
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Title <span className="text-cta">*</span>
							</label>
							<input
								value={v.title}
								onChange={(e) =>
									setV((prev) => ({ ...prev, title: e.target.value }))
								}
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								placeholder="e.g Labeld Nights: Live in Lagos"
							/>
							<p className="text-xs text-text-muted mt-1">
								URL: {v.slug ? `https://events.labeld.app/${v.slug}` : "—"}
							</p>
						</div>
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Description <span className="text-cta">*</span>
							</label>
							<textarea
								rows={5}
								value={v.description}
								onChange={(e) =>
									setV((prev) => ({ ...prev, description: e.target.value }))
								}
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								placeholder="Tell people what this event is about, who’s performing, etc."
							/>
						</div>
					</div>

					{/* Cover Image */}
					<div className="rounded-2xl bg-surface border border-stroke p-6">
						<label className="block text-sm text-text-muted mb-2">
							Cover image <span className="text-cta">*</span>
						</label>

						{coverPreview && (
							<div className="relative w-full aspect-video max-h-[60vh] overflow-hidden rounded-xl border border-stroke mb-3">
								<OptimizedImage
									src={coverPreview}
									alt="Cover preview"
									fill
									sizeContext="card"
									objectFit="cover"
									className="w-full"
								/>
							</div>
						)}

						<input
							type="file"
							accept="image/*"
							onChange={onPickCover}
							className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border file:border-stroke file:bg-bg file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-surface"
						/>
						<p className="text-xs text-text-muted mt-2">
							Upload a cover image for your event. Recommended: 1:1 aspect
							ratio, JPG/PNG/WebP, max 2MB.
						</p>
					</div>

					{/* Date & Time */}
					<div className="rounded-2xl bg-surface border border-stroke p-6 flex flex-col gap-5">
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="block text-sm text-text-muted mb-2">
									Start <span className="text-cta">*</span>
								</label>
								<input
									type="datetime-local"
									value={v.startAt as unknown as string}
									onChange={(e) =>
										setV((prev) => ({ ...prev, startAt: e.target.value }))
									}
									className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								/>
							</div>
							<div>
								<label className="block text-sm text-text-muted mb-2">
									End <span className="text-cta">*</span>
								</label>
								<input
									type="datetime-local"
									value={v.endAt as unknown as string}
									onChange={(e) =>
										setV((prev) => ({ ...prev, endAt: e.target.value }))
									}
									className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Timezone <span className="text-cta">*</span>
							</label>
							<select
								value={v.timezone}
								onChange={(e) =>
									setV((prev) => ({ ...prev, timezone: e.target.value }))
								}
								className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface"
							>
								{TIMEZONES.map((tz) => (
									<option key={tz.value} value={tz.value}>
										{tz.label}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Venue */}
					<div className="rounded-2xl bg-surface border border-stroke p-6 flex flex-col gap-5">
						<fieldset>
							<legend className="px-1 text-sm text-text-muted">
								Venue <span className="text-cta">*</span>
							</legend>
							<div className="grid gap-4 sm:grid-cols-2 mt-2">
								<input
									className="rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
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
									className="rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
									placeholder="Address"
									value={v.venue.address}
									onChange={(e) =>
										setV((p) => ({
											...p,
											venue: { ...p.venue, address: e.target.value },
										}))
									}
								/>
								{/* <input
									className="rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
									placeholder="City"
									value={v.venue.city}
									onChange={(e) =>
										setV((p) => ({
											...p,
											venue: { ...p.venue, city: e.target.value },
										}))
									}
								/> */}
								<select
									className="rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface"
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
									className="rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent bg-surface"
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
					<div className="rounded-2xl bg-surface border border-stroke p-6 flex flex-col gap-5">
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label className="block text-sm text-text-muted mb-2">
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
									className="w-full rounded-xl border border-stroke px-4 py-3 bg-surface text-text outline-none focus:border-accent"
								>
									<option value="limited">Limited</option>
									<option value="unlimited">Unlimited</option>
								</select>
							</div>
							{v.capacityMode === "limited" && (
								<div>
									<label className="block text-sm text-text-muted mb-2">
										Capacity (when limited) <span className="text-cta">*</span>
									</label>
									<input
										type="number"
										min={1}
										value={capacityInput}
										onChange={(e) => setCapacityInput(e.target.value)}
										className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm text-text-muted mb-2">
								Visibility <span className="text-cta">*</span>
							</label>
							<div className="flex gap-3">
								{(["public", "unlisted"] as const).map((val) => (
									<button
										key={val}
										type="button"
										onClick={() =>
											setV((prev) => ({ ...prev, visibility: val }))
										}
										className={[
											"px-3 py-1.5 rounded-full border",
											v.visibility === val
												? "border-accent text-accent"
												: "border-stroke text-text",
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
				<div className="mt-8 flex items-center justify-between">
					<Button
						text="Save draft"
						variant="outline"
						onClick={saveAndGo}
						outlineColor="text-text-muted"
					/>
					<Button
						text={saving ? "Saving…" : "Save & Continue → Tickets"}
						variant={canContinue && !err ? "primary" : "disabled"}
						disabled={!canContinue || saving || !!err}
						onClick={saveAndGo}
					/>
				</div>
			</div>
		</>
	);
}
