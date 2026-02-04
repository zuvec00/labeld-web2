/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { Spinner } from "@/components/ui/spinner";
import Button from "@/components/ui/button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { uploadFileGetURL } from "@/lib/storage/upload";
import { uploadImageCloudinary } from "@/lib/storage/cloudinary";
import {
	doc,
	getFirestore,
	getDoc,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import {
	Check,
	Copy,
	Link as LinkIcon,
	Loader2,
	X,
	AlertCircle,
} from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import { slugify } from "@/lib/utils";
import { EventOrganizerModel } from "@/lib/models/eventOrganizer";
import countriesJson from "@/data/countries_and_states.json";

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

/* --------------------------------- UI -------------------------------- */
function baseField() {
	return "w-full rounded-xl border border-stroke bg-surface px-3 py-2 outline-none focus:border-accent";
}
function Group({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-2xl border border-stroke bg-surface p-6">
			{children}
		</div>
	);
}
function Label({ text, required }: { text: string; required?: boolean }) {
	return (
		<div className="text-sm font-medium mb-2">
			{text} {required ? <span className="text-red-500">*</span> : null}
		</div>
	);
}
function Hint({ text }: { text: string }) {
	return <div className="text-text-muted text-sm mt-1">{text}</div>;
}
function ErrorText({ text }: { text?: string | null }) {
	if (!text) return null;
	return <div className="text-sm text-alert mt-1">{text}</div>;
}

/* ----------------------------- validators ---------------------------- */
const EVENT_CATEGORIES = [
	"Nightlife",
	"Concert",
	"Festival",
	"Art & Culture",
	"Food & Drink",
	"Corporate",
	"Wellness",
	"Workshop",
	"Community",
	"Other",
];

function usernameValid(u: string) {
	const re = /^[a-zA-Z0-9](?!.*[_.]{2})[a-zA-Z0-9._]{1,13}[a-zA-Z0-9]$/;
	return re.test(u) && u.length >= 3 && u.length <= 15 && !u.includes(" ");
}

/* --------------------------- image pickers --------------------------- */
function SingleImagePicker({
	title,
	existingUrl,
	file,
	onPick,
	circle,
}: {
	title?: string;
	existingUrl?: string | null;
	file: File | null;
	onPick: (f: File | null) => void;
	circle?: boolean;
}) {
	const radius = circle ? "rounded-full" : "rounded-xl";
	const size = circle ? "w-40 h-40" : "w-full max-h-64";

	return (
		<div className="flex flex-col gap-3">
			{title ? <Label text={title} /> : null}
			{existingUrl ? (
				<div
					className={`${size} relative overflow-hidden ${radius} border border-stroke`}
				>
					<OptimizedImage
						src={existingUrl}
						alt={title || "Image"}
						fill
						sizeContext={circle ? "thumbnail" : "card"}
						objectFit="cover"
					/>
				</div>
			) : file ? (
				<div
					className={`${size} relative overflow-hidden ${radius} border border-stroke`}
				>
					<OptimizedImage
						src={URL.createObjectURL(file)}
						alt="Preview"
						fill
						sizeContext={circle ? "thumbnail" : "card"}
						objectFit="cover"
					/>
				</div>
			) : (
				<label className="block cursor-pointer">
					<div
						className={`border border-dashed border-stroke p-4 text-center ${radius} hover:bg-bg transition-colors`}
					>
						<p className="text-text-muted">No image selected</p>
					</div>
					<input
						type="file"
						accept="image/*"
						className="sr-only"
						onChange={(e) => onPick(e.target.files?.[0] ?? null)}
					/>
				</label>
			)}
		</div>
	);
}

/* -------------------------------- page -------------------------------- */
export default function EditOrganizerProfilePage() {
	const router = useRouter();
	const { roleDetection } = useDashboardContext();
	const { toast } = useToast();
	const db = getFirestore();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);
	const [organizer, setOrganizer] = useState<EventOrganizerModel | null>(null);

	// form state
	const [organizerName, setOrganizerName] = useState("");
	const [username, setUsername] = useState("");
	const [bio, setBio] = useState("");
	const [eventCategory, setEventCategory] = useState<string | null>(null);

	const [phoneNumber, setPhoneNumber] = useState("");
	const [email, setEmail] = useState("");

	// Socials
	const [instagram, setInstagram] = useState("");
	const [twitter, setTwitter] = useState("");
	const [website, setWebsite] = useState("");
	const [tiktok, setTiktok] = useState("");

	// Location
	const [baseCity, setBaseCity] = useState("");
	const [country, setCountry] = useState<string | null>(null); // Though model just has baseCity, keeping for structure/future

	// Slug State
	const [slug, setSlug] = useState("");
	const [initialSlug, setInitialSlug] = useState("");
	const [isEditingSlug, setIsEditingSlug] = useState(false);
	const [slugError, setSlugError] = useState<string | null>(null);
	const [checkingSlug, setCheckingSlug] = useState(false);
	const [slugAvailable, setSlugAvailable] = useState(false);
	const [savingSlug, setSavingSlug] = useState(false);

	// images
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [coverFile, setCoverFile] = useState<File | null>(null);
	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

	// errors
	const [usernameError, setUsernameError] = useState<string | null>(null);

	const isPro = roleDetection?.eventSubscriptionTier === "pro";

	// Countries list logic (same as brand)
	const { COUNTRY_LIST } = useMemo(() => {
		const payload = countriesJson as CountriesPayload;
		const list = Array.from(new Set((payload.data ?? []).map((c) => c.name)));
		return { COUNTRY_LIST: list.sort() };
	}, []);

	// Load Data
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const auth = getAuth();
				const uid = auth.currentUser?.uid;
				if (!uid) {
					router.push("/");
					return;
				}

				const ref = doc(db, "eventOrganizers", uid);
				const snap = await getDoc(ref);

				if (!mounted) return;
				if (!snap.exists()) {
					setErr("Organizer profile not found.");
					setLoading(false);
					return;
				}

				const data = snap.data() as EventOrganizerModel;
				setOrganizer(data);

				setOrganizerName(data.organizerName || "");
				setUsername(data.username || "");
				setBio(data.bio || "");
				setEventCategory(data.eventCategory || null);
				setBaseCity(data.baseCity || "");

				setPhoneNumber(data.phone || "");
				setEmail(data.email || "");

				setInstagram(data.instagram || "");
				setTwitter(data.twitter || "");
				setWebsite(data.website || "");
				setTiktok(data.tiktok || "");

				setLogoUrl(data.logoUrl || null);
				setCoverImageUrl(data.coverImageUrl || null);

				// Slug logic
				const currentSlug = data.slug || data.username || "";
				setSlug(currentSlug);
				setInitialSlug(currentSlug);
			} catch (e: any) {
				if (!mounted) return;
				setErr(e?.message ?? "Failed to load profile.");
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [router, db]);

	const canSave = useMemo(() => {
		const unameOk = usernameValid(username.trim());
		const hasName = !!organizerName.trim();
		return hasName && unameOk;
	}, [organizerName, username]);

	async function onSave() {
		if (!organizer || !canSave) return;
		setSaving(true);
		setErr(null);
		setUsernameError(null);

		try {
			const auth = getAuth();
			const uid = auth.currentUser?.uid;
			if (!uid) throw new Error("User not found.");

			const uname = username.trim().toLowerCase();

			if (!usernameValid(uname)) {
				setUsernameError("Invalid username format.");
				setSaving(false);
				return;
			}

			// If username changed, check availability
			// Note: We are using 'brands' logic for username uniqueness usually,
			// but organizers might share namespace? For now, we assume simple check.
			// Ideally need `isOrganizerUsernameTaken` query.
			// Assuming for V1 simple update, relying on security rules or unique index fail.

			// uploads
			let nextLogoUrl = logoUrl ?? null;
			if (logoFile) {
				try {
					nextLogoUrl = await uploadImageCloudinary(logoFile, {
						folder: `organizerImages/${uid}`,
						tags: ["organizer", "logo", uid],
					});
				} catch (e) {
					console.warn("Cloudinary failed, using Storage", e);
					nextLogoUrl = await uploadFileGetURL(
						logoFile,
						`organizerImages/${uid}/${Date.now()}-${logoFile.name}`,
					);
				}
			}

			let nextCoverUrl = coverImageUrl ?? null;
			if (coverFile) {
				try {
					nextCoverUrl = await uploadImageCloudinary(coverFile, {
						folder: `organizerCovers/${uid}`,
						tags: ["organizer", "cover", uid],
					});
				} catch (e) {
					nextCoverUrl = await uploadFileGetURL(
						coverFile,
						`organizerCovers/${uid}/${Date.now()}-${coverFile.name}`,
					);
				}
			}

			// Update Doc
			const updates: any = {
				organizerName: organizerName.trim(),
				username: uname,
				bio: bio.trim() || null,
				eventCategory: eventCategory || null,
				baseCity: baseCity.trim() || null,
				phone: phoneNumber.trim() || null,
				email: email.trim() || null,
				instagram: instagram.trim() || null,
				twitter: twitter.trim() || null,
				tiktok: tiktok.trim() || null,
				website: website.trim() || null,
				logoUrl: nextLogoUrl || null,
				coverImageUrl: nextCoverUrl || null,
				updatedAt: serverTimestamp(),
			};

			const ref = doc(db, "eventOrganizers", uid);
			await updateDoc(ref, updates);

			router.push("/organizer-space");
		} catch (e: any) {
			setErr(e?.message ?? "Failed to save.");
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!organizer) {
		return (
			<div className="min-h-dvh grid place-items-center text-center">
				<p>{err ?? "Not found"}</p>
				<Button text="Back" onClick={() => router.back()} />
			</div>
		);
	}

	return (
		<div className="pb-24 max-w-4xl mx-auto">
			<div className="px-4 sm:px-6 pt-6">
				<h1 className="font-heading font-semibold text-2xl">
					Edit Organizer Profile
				</h1>
				<p className="text-text-muted mt-1">Manage your event presence</p>
			</div>

			<div className="px-4 sm:px-6 mt-6 space-y-4">
				{/* Public Page URL */}
				<Group>
					<div className="flex items-center justify-between mb-2">
						<Label text="Public Page URL" />
						{!isEditingSlug && (
							<div className="flex items-center gap-2">
								<button
									onClick={() => {
										navigator.clipboard.writeText(
											`https://${slug}.labeld.app/`,
										);
										toast({ description: "Link copied" });
									}}
									className="text-xs font-medium text-text-muted hover:text-text flex items-center gap-1.5 transition-colors"
								>
									<Copy className="w-3 h-3" />
									Copy link
								</button>
								{isPro ? (
									<button
										onClick={() => setIsEditingSlug(true)}
										className="text-xs font-medium text-cta hover:underline"
									>
										Edit
									</button>
								) : (
									<span className="text-xs text-text-muted flex items-center gap-1">
										<span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
										Pro
									</span>
								)}
							</div>
						)}
					</div>

					{isEditingSlug ? (
						<div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
							<div className="relative">
								<div className="flex items-center w-full rounded-xl border border-stroke bg-surface focus-within:border-accent transition-colors overflow-hidden">
									<input
										value={slug}
										onChange={(e) => {
											// Allow user to type dashes, but prevent dots/spaces/symbols.
											// We replace invalid chars with '-' so 'my.event' becomes 'my-event'.
											// We also collapse multiple dashes.
											const val = e.target.value
												.toLowerCase()
												.replace(/[^a-z0-9-]/g, "-")
												.replace(/-+/g, "-");

											setSlug(val);
											setSlugError(null);
											setSlugAvailable(false);

											if (val.length < 3) {
												setSlugError("Too short");
												return;
											}
											if (val === initialSlug) {
												setSlugAvailable(true);
												return;
											}

											setCheckingSlug(true);
											const timeout = setTimeout(async () => {
												// Dynamic import to avoid SSR issues if complex
												const { isPublicSlugTaken } =
													await import("@/lib/firebase/slugs");

												if (val === initialSlug) {
													setCheckingSlug(false);
													setSlugAvailable(true);
													return;
												}

												// Check registry for any collision
												// We use slugify(val) to ensure we check the TRULY final version (trimmed)
												const cleanVal = slugify(val);
												const taken = await isPublicSlugTaken(cleanVal);
												setCheckingSlug(false);
												if (taken) {
													setSlugError("Unavailable");
													setSlugAvailable(false);
												} else {
													setSlugAvailable(true);
													setSlugError(null);
												}
											}, 500);
											return () => clearTimeout(timeout);
										}}
										className="flex-1 bg-transparent px-3 py-2 outline-none text-text placeholder:text-text-muted font-medium"
									/>
									<div className="px-3 py-2 bg-surface-neutral text-text-muted border-r border-stroke text-sm font-medium">
										.labeld.app/
									</div>
								</div>
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									{checkingSlug ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : slugError ? (
										<X className="w-4 h-4 text-alert" />
									) : slugAvailable ? (
										<Check className="w-4 h-4 text-green-500" />
									) : null}
								</div>
							</div>

							{slugError && <p className="text-xs text-alert">{slugError}</p>}

							<div className="flex items-center gap-2 pt-1">
								<Button
									size="sm"
									variant="secondary"
									onClick={() => {
										setIsEditingSlug(false);
										setSlug(initialSlug);
										setSlugError(null);
									}}
								>
									Cancel
								</Button>
								<Button
									size="sm"
									disabled={
										!slugAvailable ||
										!!slugError ||
										slug === initialSlug ||
										checkingSlug ||
										savingSlug
									}
									onClick={async () => {
										if (!organizer) return;
										setSavingSlug(true);
										try {
											const { isPublicSlugTaken, updateSlug } =
												await import("@/lib/firebase/slugs");
											if (slug !== initialSlug) {
												const taken = await isPublicSlugTaken(slug);
												if (taken) {
													setSlugError("Taken");
													setSavingSlug(false);
													return;
												}
											}

											// Update registry: we treat organizer slugs usually as 'experience' or just generic redirect
											// But currently they route to events.labeld.app/[slug].
											// The registry might need 'organizer' type or we just update the doc if we don't use global slugs for organizer pages yet?
											// Assuming we DO use global registry for uniqueness:

											// Note: user requested "edit page for event organizer simlar to brand space"
											// Brand space uses updateSlug().
											await updateSlug(
												initialSlug,
												slugify(slug),
												"experience", // tagging as experience? or organizer? Let's use 'experience' as it aligns with event sites
												organizer.uid, // target ID
												organizer.uid, // owner ID
											);

											// Update local doc
											await updateDoc(
												doc(db, "eventOrganizers", organizer.uid),
												{
													slug: slugify(slug),
												},
											);

											setInitialSlug(slug);
											setIsEditingSlug(false);
											toast({ title: "URL updated successfully" });
										} catch (e: any) {
											console.error(e);
											toast({ title: "Update failed", variant: "destructive" });
										} finally {
											setSavingSlug(false);
										}
									}}
								>
									{savingSlug ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										"Save URL"
									)}
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-3">
							<div className="flex items-center justify-between p-3 bg-surface-neutral/30 rounded-xl border border-dashed border-stroke">
								<span className="font-heading font-medium text-text text-lg tracking-tight">
									{slug}.labeld.app
								</span>
							</div>
							{!isPro && (
								<p className="text-xs text-text-muted">
									<LinkIcon className="w-3 h-3 inline mr-1" />
									Upgrade to Pro to customize this URL.
								</p>
							)}
						</div>
					)}
				</Group>

				{/* Identity */}
				<Group>
					<Label text="Organizer Name" required />
					<input
						className={baseField()}
						value={organizerName}
						onChange={(e) => setOrganizerName(e.target.value)}
						placeholder="e.g. Lagos City Marathon"
					/>

					<div className="mt-4">
						<Label text="Username (@handle)" required />
						<input
							className={baseField()}
							value={username}
							onChange={(e) => {
								setUsername(e.target.value);
								if (!usernameValid(e.target.value)) {
									setUsernameError("3-15 chars, no spaces/special chars.");
								} else {
									setUsernameError(null);
								}
							}}
						/>
						<ErrorText text={usernameError} />
					</div>

					<div className="mt-4">
						<Label text="Event Category" />
						<select
							className={baseField()}
							value={eventCategory ?? ""}
							onChange={(e) => setEventCategory(e.target.value || null)}
						>
							<option value="" disabled>
								Select Category
							</option>
							{EVENT_CATEGORIES.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>

					<div className="mt-4">
						<Label text="Bio" />
						<textarea
							className={baseField()}
							rows={3}
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							placeholder="Tell us about your events..."
						/>
					</div>
				</Group>

				{/* Visuals */}
				<Group>
					<SingleImagePicker
						title="Organizer Logo"
						existingUrl={logoUrl}
						file={logoFile}
						onPick={setLogoFile}
						circle
					/>
					<div className="mt-6" />
					<SingleImagePicker
						title="Cover Image"
						existingUrl={coverImageUrl}
						file={coverFile}
						onPick={setCoverFile}
					/>
				</Group>

				{/* Contact */}
				<Group>
					<Label text="Base City" />
					<input
						className={baseField()}
						value={baseCity}
						onChange={(e) => setBaseCity(e.target.value)}
						placeholder="e.g. Lagos"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
						<div>
							<Label text="Email" />
							<input
								className={baseField()}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Official contact email"
							/>
						</div>
						<div>
							<Label text="Phone" />
							<input
								className={baseField()}
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
								placeholder="Contact phone"
							/>
						</div>
					</div>
				</Group>

				{/* Socials */}
				<Group>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label text="Instagram" />
							<input
								className={baseField()}
								value={instagram}
								onChange={(e) => setInstagram(e.target.value)}
								placeholder="username"
							/>
						</div>
						<div>
							<Label text="Twitter / X" />
							<input
								className={baseField()}
								value={twitter}
								onChange={(e) => setTwitter(e.target.value)}
								placeholder="username"
							/>
						</div>
						<div>
							<Label text="TikTok" />
							<input
								className={baseField()}
								value={tiktok}
								onChange={(e) => setTiktok(e.target.value)}
								placeholder="username"
							/>
						</div>
						<div>
							<Label text="Website" />
							<input
								className={baseField()}
								value={website}
								onChange={(e) => setWebsite(e.target.value)}
								placeholder="https://..."
							/>
						</div>
					</div>
				</Group>
			</div>

			{/* Footer Sync */}
			<div className="fixed inset-x-0 bottom-0 bg-bg/80 backdrop-blur border-t border-stroke px-4 sm:px-6 py-3 z-50">
				<div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
					<Button
						text="Cancel"
						variant="secondary"
						onClick={() => router.back()}
					/>
					<Button
						text={saving ? "Saving..." : "Save Changes"}
						variant="primary"
						disabled={!canSave || saving}
						onClick={onSave}
						isLoading={saving}
					/>
				</div>
			</div>

			{err && (
				<div className="fixed left-1/2 -translate-x-1/2 bottom-20 bg-alert/10 text-alert px-4 py-2 rounded-xl border border-alert/20 animate-in fade-in slide-in-from-bottom-2">
					{err}
				</div>
			)}
		</div>
	);
}
