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
	fetchBrandById,
	isBrandUsernameTaken,
	isBrandSlugTaken,
	updateBrandProfile,
} from "@/lib/firebase/queries/brandspace";
import { useBrandOnboard } from "@/lib/stores/brandOnboard";
import { BrandModel } from "@/lib/models/brand";
import countriesJson from "@/data/countries_and_states.json";
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { Check, Copy, Loader2, X } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";

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
const BRAND_TYPES = [
	"Afrofusion",
	"Alt / Grunge",
	"Athleisure",
	"Casual Basics",
	"Custom / Made-to-Order",
	"Genderless / Androgynous",
	"Luxury / Designer-Inspired",
	"Minimal Street",
	"Retro / Y2K",
	"Skatewear",
	"Streetwear",
	"Sustainable / Eco-Conscious",
	"Techwear / Futuristic",
	"Thrift / Vintage",
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

/* ------------------------------ TagsInput ---------------------------- */
function TagsInput({
	value,
	onChange,
	maxTags = 3,
	placeholder = "Add a tag and press Enter",
}: {
	value: string[];
	onChange: (v: string[]) => void;
	maxTags?: number;
	placeholder?: string;
}) {
	const [draft, setDraft] = useState("");
	const [msg, setMsg] = useState<string | null>(null);

	function uniq(arr: string[]) {
		return Array.from(new Set(arr));
	}
	function commit(val: string) {
		const t = val.trim();
		if (!t) return;
		const next = uniq([...value, t]);
		if (next.length > maxTags) {
			setMsg(`Max ${maxTags} tags.`);
			return;
		}
		onChange(next);
		setDraft("");
		setMsg(null);
	}

	return (
		<div>
			{!!value.length && (
				<div className="flex flex-wrap gap-2 mb-2">
					{value.map((t) => (
						<span
							key={t}
							className="inline-flex items-center gap-2 rounded-full border border-stroke bg-surface px-3 py-1.5"
						>
							{t}
							<button
								type="button"
								className="text-text-muted hover:text-text"
								onClick={() => onChange(value.filter((v) => v !== t))}
							>
								×
							</button>
						</span>
					))}
				</div>
			)}
			<div className="flex gap-2">
				<input
					className={baseField()}
					value={draft}
					placeholder={placeholder}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === ",") {
							e.preventDefault();
							commit(draft);
						}
						if (e.key === "Backspace" && !draft && value.length)
							onChange(value.slice(0, -1));
					}}
				/>
				<button
					type="button"
					className="rounded-xl bg-accent text-bg px-4 py-2 font-semibold"
					onClick={() => commit(draft)}
				>
					Add
				</button>
			</div>
			{msg && <div className="text-xs text-alert mt-2">{msg}</div>}
			<div className="text-xs text-text-muted mt-1">
				{value.length}/{maxTags} tags
			</div>
		</div>
	);
}

/* -------------------------------- page -------------------------------- */
export default function EditBrandProfilePage() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);
	const [brand, setBrand] = useState<BrandModel | null>(null);

	// form
	const [brandName, setBrandName] = useState("");
	const [username, setUsername] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [bio, setBio] = useState("");
	const [category, setCategory] = useState<string | null>(null);
	const [brandTags, setBrandTags] = useState<string[]>([]);
	const [instagram, setInstagram] = useState("");
	const [youtube, setYoutube] = useState("");
	const [tiktok, setTiktok] = useState("");

	// Slug State
	const [brandSlug, setBrandSlug] = useState("");
	const [initialSlug, setInitialSlug] = useState("");
	const [isEditingSlug, setIsEditingSlug] = useState(false);
	const [slugError, setSlugError] = useState<string | null>(null);
	const [checkingSlug, setCheckingSlug] = useState(false);
	const [slugAvailable, setSlugAvailable] = useState(false);
	const [savingSlug, setSavingSlug] = useState(false);

	const { roleDetection } = useDashboardContext();
	const { toast } = useToast();
	const isPro = roleDetection?.brandSubscriptionTier === "pro";

	// locations
	// ✅ use your store
	const { country, state, set } = useBrandOnboard();
	// images
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [coverFile, setCoverFile] = useState<File | null>(null);
	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

	// errors
	const [usernameError, setUsernameError] = useState<string | null>(null);

	// ✅ build lists from the imported JSON (no network)
	const { COUNTRY_LIST, COUNTRY_TO_STATES } = useMemo(() => {
		const payload = countriesJson as CountriesPayload;
		// Use Set to remove duplicates immediately
		const list = Array.from(new Set((payload.data ?? []).map((c) => c.name)));
		const map: Record<string, string[]> = {};
		for (const c of payload.data ?? []) {
			map[c.name] = (c.states ?? [])
				.map((s) => s?.name)
				.filter(Boolean) as string[];
		}
		return { COUNTRY_LIST: list.sort(), COUNTRY_TO_STATES: map };
	}, []);

	const states = country ? COUNTRY_TO_STATES[country] ?? [] : [];

	// load brand
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
				const b = await fetchBrandById(uid);
				if (!mounted) return;
				if (!b) {
					setErr("Brand profile not found.");
					setLoading(false);
					return;
				}

				setBrand(b);
				setBrandName(b.brandName ?? "");
				setUsername(b.username ?? "");
				setBio(b.bio ?? "");
				setCategory(b.category ?? null);
				setBrandTags(b.brandTags ?? []);
				setLogoUrl(b.logoUrl ?? null);
				setCoverImageUrl(b.coverImageUrl ?? null);

				// Slug Logic: Default to brandSlug if exists, else fallback to username
				const slug = b.brandSlug || b.username || "";
				setBrandSlug(slug);
				setInitialSlug(slug);

				set("country", b.country ?? null);
				set("state", b.state ?? null);
				setInstagram(b.instagram ?? "");
				setYoutube(b.youtube ?? "");
				setTiktok(b.tiktok ?? "");
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
	}, [router, set]);

	// update states when country changes
	useEffect(() => {
		if (!country || !COUNTRY_TO_STATES[country]) {
			set("state", null);
			return;
		}
		set("state", COUNTRY_TO_STATES[country][0] || null);
	}, [country, COUNTRY_TO_STATES, set]);

	const canSave = useMemo(() => {
		const unameOk = usernameValid(username.trim());
		const logoOk = !!(logoUrl || logoFile);
		return (
			!!brandName.trim() && !!username.trim() && unameOk && !!category && logoOk
		);
	}, [brandName, username, category, logoUrl, logoFile]);

	async function onSave() {
		if (!brand || !canSave) return;

		setSaving(true);
		setErr(null);
		setUsernameError(null);

		try {
			const auth = getAuth();
			const uid = auth.currentUser?.uid;
			if (!uid) {
				setErr("User not found.");
				setSaving(false);
				return;
			}
			const uname = username.trim().toLowerCase();

			if (!usernameValid(uname)) {
				setUsernameError("Invalid username.");
				setSaving(false);
				return;
			}

			if (uname !== (brand.username ?? "").toLowerCase()) {
				const taken = await isBrandUsernameTaken(uname, uid);
				if (taken) {
					setUsernameError("This username is already taken.");
					setSaving(false);
					return;
				}
			}

			// uploads
			let nextLogoUrl = logoUrl ?? null;
			if (logoFile) {
				try {
					// Primary: Upload to Cloudinary
					nextLogoUrl = await uploadImageCloudinary(logoFile, {
						folder: `brandImages/${uid}`,
						tags: ["brand", "logo", uid],
					});
					console.log("✅ Brand logo uploaded to Cloudinary:", nextLogoUrl);
				} catch (cloudinaryError) {
					// Fallback: Upload to Firebase Storage
					console.warn(
						"⚠️ Cloudinary upload failed, falling back to Firebase Storage:",
						cloudinaryError
					);
					nextLogoUrl = await uploadFileGetURL(
						logoFile,
						`brandImages/${uid}/${Date.now()}-${logoFile.name}`
					);
					console.log(
						"✅ Brand logo uploaded to Firebase Storage:",
						nextLogoUrl
					);
				}
			}

			let nextCoverUrl = coverImageUrl ?? null;
			if (coverFile) {
				try {
					// Primary: Upload to Cloudinary
					nextCoverUrl = await uploadImageCloudinary(coverFile, {
						folder: `brandCovers/${uid}`,
						tags: ["brand", "cover", uid],
					});
					console.log("✅ Brand cover uploaded to Cloudinary:", nextCoverUrl);
				} catch (cloudinaryError) {
					// Fallback: Upload to Firebase Storage
					console.warn(
						"⚠️ Cloudinary upload failed, falling back to Firebase Storage:",
						cloudinaryError
					);
					nextCoverUrl = await uploadFileGetURL(
						coverFile,
						`brandCovers/${uid}/${Date.now()}-${coverFile.name}`
					);
					console.log(
						"✅ Brand cover uploaded to Firebase Storage:",
						nextCoverUrl
					);
				}
			}

			await updateBrandProfile(uid, {
				brandName: brandName.trim(),
				username: uname,
				phoneNumber: phoneNumber.trim() || null,
				bio: bio.trim() || null,
				category: category || undefined,
				brandTags,
				logoUrl: nextLogoUrl ?? undefined,
				coverImageUrl: nextCoverUrl,
				country: country || null,
				state: state || null,
				instagram: instagram.trim() || null,
				youtube: youtube.trim() || null,
				tiktok: tiktok.trim() || null,
			});

			// DUPLICATE SAVE: Update user collection with phone number
			if (phoneNumber.trim()) {
				try {
					const db = getFirestore();
					await updateDoc(doc(db, "users", uid), {
						phoneNumber: phoneNumber.trim(),
					});
				} catch (err) {
					console.error("Failed to sync phone number to user doc", err);
				}
			}

			router.push("/brand-space"); // or your profile page
		} catch (e: any) {
			setErr(e?.message ?? "Failed to save changes.");
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
	if (!brand) {
		return (
			<div className="min-h-dvh grid place-items-center">
				<div className="text-center">
					<p className="text-text-muted mb-3">{err ?? "Not found."}</p>
					<Button text="Back" onClick={() => router.back()} />
				</div>
			</div>
		);
	}

	return (
		<div className="pb-24">
			<div className="px-4 sm:px-6 pt-6">
				<h1 className="font-heading font-semibold text-2xl">
					Edit Brand Profile
				</h1>
				<p className="text-text-muted mt-1">Update your brand details below</p>
			</div>

			<div className="px-4 sm:px-6 mt-6 space-y-4">
				{/* Public Store URL */}
				<Group>
					<div className="flex items-center justify-between mb-2">
						<Label text="Public Store URL" />
						{!isEditingSlug && (
							<div className="flex items-center gap-2">
								<button
									onClick={() => {
										navigator.clipboard.writeText(
											`https://${brandSlug}.labeld.app`
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
										value={brandSlug}
										onChange={(e) => {
											const val = e.target.value
												.toLowerCase()
												.replace(/[^a-z0-9-]/g, ""); // Basic input masking
											setBrandSlug(val);
											setSlugError(null);
											setSlugAvailable(false);

											// 3-30 chars, start w/ letter, no spaces (implied by masking)
											if (val.length < 3) {
												setSlugError("Too short (min 3 chars)");
												return;
											}
											if (!/^[a-z]/.test(val)) {
												setSlugError("Must start with a letter");
												return;
											}
											if (val.length > 30) {
												setSlugError("Too long");
												return;
											}

											// Check if unchanged
											if (val === initialSlug) {
												setSlugAvailable(true);
												return;
											}

											// Debounced availability check
											setCheckingSlug(true);
											const timeout = setTimeout(async () => {
												const taken = await isBrandSlugTaken(val, brand?.uid);
												setCheckingSlug(false);
												if (taken) {
													setSlugError("Already taken");
													setSlugAvailable(false);
												} else {
													setSlugAvailable(true);
													setSlugError(null);
												}
											}, 500);
											return () => clearTimeout(timeout);
										}}
										className="flex-1 bg-transparent px-3 py-2 outline-none text-text placeholder:text-text-muted font-medium"
										placeholder="yourslug"
										autoFocus
									/>
									<div className="px-3 py-2 bg-surface-neutral text-text-muted border-l border-stroke text-sm font-medium">
										.labeld.app
									</div>
								</div>

								{/* Availability Indicator */}
								<div className="absolute right-[6.5rem] top-1/2 -translate-y-1/2">
									{checkingSlug ? (
										<Loader2 className="w-4 h-4 animate-spin text-text-muted" />
									) : slugError ? (
										<X className="w-4 h-4 text-alert" />
									) : slugAvailable ? (
										<Check className="w-4 h-4 text-green-500" />
									) : null}
								</div>
							</div>

							{slugError && <p className="text-xs text-alert">{slugError}</p>}
							{slugAvailable && !slugError && brandSlug !== initialSlug && (
								<p className="text-xs text-green-600">✓ Available</p>
							)}

							<div className="flex items-center gap-2 pt-1">
								<Button
									size="sm"
									variant="secondary"
									onClick={() => {
										setIsEditingSlug(false);
										setBrandSlug(initialSlug); // Reset
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
										brandSlug === initialSlug ||
										checkingSlug ||
										savingSlug
									}
									onClick={async () => {
										if (!brand) return;
										setSavingSlug(true);
										try {
											// Final safety check
											const taken = await isBrandSlugTaken(
												brandSlug,
												brand.uid
											);
											if (taken) {
												setSlugError("Already taken");
												setSavingSlug(false);
												return;
											}

											await updateBrandProfile(brand.uid, {
												brandSlug: brandSlug,
											});
											setInitialSlug(brandSlug);
											setIsEditingSlug(false);
											toast({ title: "Public store URL updated" });
										} catch (e) {
											toast({
												title: "Failed to update URL",
												variant: "destructive",
											});
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
									{brandSlug}.labeld.app
								</span>
							</div>
							{!isPro && (
								<div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3 flex items-start gap-3">
									<div className="mt-0.5">
										<div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-white">
											★
										</div>
									</div>
									<div>
										<p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
											Custom Store URL
										</p>
										<p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed mb-2">
											Upgrade to Pro to customize your storefront link (e.g.{" "}
											<span className="font-mono">brand.labeld.app</span>).
										</p>
										<button
											onClick={() => router.push("/pricing")}
											className="text-xs font-semibold text-amber-800 dark:text-amber-200 hover:underline"
										>
											Upgrade to Pro →
										</button>
									</div>
								</div>
							)}
							<p className="text-text-muted text-sm">
								This is your public storefront link.
							</p>
						</div>
					)}
				</Group>

				{/* Brand & Username & Category */}
				<Group>
					<Label text="Brand Name" required />
					<input
						className={baseField()}
						value={brandName}
						onChange={(e) => setBrandName(e.target.value)}
						placeholder="e.g. The 90s Plug"
					/>

					<div className="mt-4">
						<Label text="Username" required />
						<input
							className={baseField()}
							value={username}
							onChange={(e) => {
								setUsername(e.target.value);
								if (!usernameValid(e.target.value)) {
									setUsernameError(
										"3–15 chars. Letters, numbers, underscores, periods. No spaces or consecutive special characters."
									);
								} else {
									setUsernameError(null);
								}
							}}
							placeholder="This is your brand's @handle"
						/>
						<ErrorText text={usernameError} />
					</div>

					<div className="mt-4">
						<Label text="Phone Number" required />
						<input
							className={baseField()}
							value={phoneNumber}
							onChange={(e) => setPhoneNumber(e.target.value)}
							placeholder="+234..."
						/>
					</div>

					<div className="mt-4">
						<Label text="Brand Category" required />
						<select
							className={baseField()}
							value={category ?? ""}
							onChange={(e) => setCategory(e.target.value || null)}
						>
							<option value="" disabled>
								Pick what fits your brand the most
							</option>
							{BRAND_TYPES.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
					</div>
				</Group>

				{/* Logo & Cover */}
				<Group>
					<SingleImagePicker
						title="Brand Logo"
						existingUrl={logoUrl}
						file={logoFile}
						onPick={setLogoFile}
						circle
					/>
					<Hint text="Upload a clean logo or image that reps your brand" />

					<div className="mt-6" />
					<SingleImagePicker
						title="Cover Image"
						existingUrl={coverImageUrl}
						file={coverFile}
						onPick={setCoverFile}
					/>
					<Hint text="Set the vibe. Pick a banner that shows off your world" />
				</Group>

				{/* Socials */}
				<Group>
					<Label text="Instagram" />
					<input
						className={baseField()}
						value={instagram}
						onChange={(e) => setInstagram(e.target.value)}
						placeholder="Instagram URL"
					/>

					<div className="mt-4">
						<Label text="YouTube" />
						<input
							className={baseField()}
							value={youtube}
							onChange={(e) => setYoutube(e.target.value)}
							placeholder="YouTube URL"
						/>
					</div>

					<div className="mt-4">
						<Label text="TikTok" />
						<input
							className={baseField()}
							value={tiktok}
							onChange={(e) => setTiktok(e.target.value)}
							placeholder="TikTok URL"
						/>
					</div>
				</Group>

				{/* Bio & Tags */}
				<Group>
					<Label text="Bio / Tagline" />
					<textarea
						className={baseField()}
						rows={4}
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						placeholder="Describe your brand in 1–2 lines?"
					/>
					<div className="mt-4">
						<Label text="Brand Tags" />
						<TagsInput value={brandTags} onChange={setBrandTags} maxTags={3} />
						<Hint text="Tags help people find and connect with your brand." />
					</div>
				</Group>

				{/* Country & State */}
				<Group>
					<Label text="Country" />
					<select
						className={baseField()}
						value={country ?? ""}
						onChange={(e) => {
							const c = e.target.value || null;
							set("country", c);
							set("state", null);
						}}
					>
						<option value="">Choose your country</option>
						{COUNTRY_LIST.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>

					<div className="mt-4">
						<Label text="State" />
						<select
							className={baseField()}
							value={state ?? ""}
							onChange={(e) => set("state", e.target.value || null)}
							disabled={!country || !states.length}
						>
							<option value="">
								{country ? "Where are you based?" : "Select a country first"}
							</option>
							{states.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</div>
				</Group>
			</div>

			{/* sticky footer */}
			<div className="fixed inset-x-0 bottom-0 bg-bg/80 backdrop-blur border-t border-stroke px-4 sm:px-6 py-3">
				<div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
					<Button
						text={saving ? "Saving…" : "Save Changes"}
						onClick={onSave}
						disabled={!canSave || saving}
						variant="primary"
					/>
				</div>
			</div>

			{err && (
				<div className="fixed left-1/2 -translate-x-1/2 bottom-20 bg-alert/10 text-alert px-4 py-2 rounded-xl border border-alert/20">
					{err}
				</div>
			)}
		</div>
	);
}
