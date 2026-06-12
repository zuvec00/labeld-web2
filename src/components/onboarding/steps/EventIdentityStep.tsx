"use client";

import { useEventOrganizerOnboard } from "@/lib/stores/eventOrganizerStore";
import { validateSlug } from "@/lib/validation/username";
import { slugify } from "@/lib/utils";
import { useUsernameAvailability } from "@/lib/hooks/useUsernameAvailability";
import { ArrowRight, Check, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface EventIdentityStepProps {
	onNext: () => void;
	onBack: () => void;
}

const EVENT_CATEGORIES = [
	"Nightlife",
	"Dining Experiences",
	"Experiences",
	"Concerts & Live Music",
	"Parties",
	"Festivals",
	"Pop-ups",
	"Community",
	"Other",
];

export default function EventIdentityStep({
	onNext,
	onBack,
}: EventIdentityStepProps) {
	const { data, setData } = useEventOrganizerOnboard();
	const { organizerName, username, eventCategory } = data;

	const userEditedHandle = useRef((username || "").length > 0);

	const [usernameError, setUsernameError] = useState<string | null>(null);

	const availabilityStatus = useUsernameAvailability(username || "", {
		type: "slug",
	});

	// Auto-generate slug from organizer name if user hasn't typed a handle
	useEffect(() => {
		if (userEditedHandle.current) return;
		if (!organizerName.trim()) return;
		const generated = slugify(organizerName);
		if (generated) setData({ username: generated });
	}, [organizerName]); // eslint-disable-line react-hooks/exhaustive-deps

	// Format validation
	useEffect(() => {
		if (!username) {
			setUsernameError(null);
			return;
		}
		const { ok } = validateSlug(username);
		if (!ok) {
			let msg = "Invalid handle";
			if (username.length < 3) msg = "Too short (min 3 chars)";
			else if (username.length > 30) msg = "Too long (max 30 chars)";
			else if (/\s/.test(username)) msg = "No spaces allowed";
			else msg = "Use lowercase letters, numbers, and hyphens only";
			setUsernameError(msg);
		} else {
			setUsernameError(null);
		}
	}, [username]);

	const isAvailable = availabilityStatus === "available";
	const isTaken = availabilityStatus === "taken";
	const isChecking = availabilityStatus === "checking";

	const canProceed =
		organizerName.trim().length > 0 &&
		(username || "").trim().length > 0 &&
		(eventCategory || "").length > 0 &&
		!usernameError &&
		isAvailable;

	const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		userEditedHandle.current = true;
		setData({ username: e.target.value.toLowerCase().trim() });
	};

	return (
		<div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
			<div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
				<h2 className="text-3xl font-heading font-bold mb-2">
					Organizer Identity
				</h2>
				<p className="text-text-muted mb-8">Who is hosting the events?</p>

				<div className="space-y-6">
					{/* Name */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Organizer / Collective Name
						</label>
						<input
							type="text"
							value={organizerName}
							autoFocus
							onChange={(e) => setData({ organizerName: e.target.value })}
							placeholder="e.g. Boiler Room"
							className="w-full bg-transparent border-b-2 border-stroke focus:border-accent text-3xl font-heading font-semibold py-2 outline-none placeholder:text-subtle transition-colors"
						/>
					</div>

					{/* Username */}
					<div className="space-y-2">
						<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
							Handle
						</label>
						<div className="relative">
							<span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl text-text-muted font-medium">
								@
							</span>
							<input
								type="text"
								value={username}
								onChange={handleUsernameChange}
								placeholder="boilerroom"
								className={`w-full bg-transparent border-b-2 ${
									usernameError || isTaken
										? "border-red-500/50 focus:border-red-500"
										: isAvailable
										? "border-green-500/50 focus:border-green-500"
										: "border-stroke focus:border-accent"
								} text-2xl font-medium py-2 pl-8 outline-none placeholder:text-subtle transition-colors`}
							/>
							<div className="absolute right-0 top-1/2 -translate-y-1/2">
								{isChecking && (
									<Loader2 className="w-4 h-4 text-text-muted animate-spin" />
								)}
								{isAvailable && !isChecking && (
									<div className="text-green-500 animate-in zoom-in duration-200">
										<Check className="w-5 h-5" />
									</div>
								)}
								{(usernameError || isTaken) && !isChecking && (
									<div className="text-red-500 animate-in zoom-in duration-200">
										<X className="w-5 h-5" />
									</div>
								)}
							</div>
						</div>
						{usernameError && (
							<p className="text-sm text-red-500 animate-in slide-in-from-top-1">
								{usernameError}
							</p>
						)}
						{isTaken && !usernameError && (
							<p className="text-sm text-red-500 animate-in slide-in-from-top-1">
								This handle is already taken. Try another.
							</p>
						)}
						{isAvailable && !usernameError && (
							<p className="text-sm text-green-500 animate-in slide-in-from-top-1">
								Handle available!
							</p>
						)}
						{isChecking && (
							<p className="text-sm text-text-muted animate-in slide-in-from-top-1">
								Checking availability…
							</p>
						)}
					</div>
				</div>

				{/* Event Category */}
				<div className="space-y-2 mt-6">
					<label className="text-sm font-medium text-text-muted uppercase tracking-wider">
						Primary Event Category <span className="text-accent">*</span>
					</label>
					<select
						value={eventCategory || ""}
						onChange={(e) => setData({ eventCategory: e.target.value })}
						className="w-full bg-surface border-b-2 border-stroke focus:border-accent font-medium py-3 outline-none transition-colors appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNoZXZyb24tZG93biI+PHBhdGggZD0ibTYgOSA2IDYgNi02Ii8+PC9zdmc+')] bg-no-repeat bg-[right_0px_center] bg-[length:20px_20px]"
					>
						<option value="" disabled>
							What kind of events do you host?
						</option>
						{EVENT_CATEGORIES.map((cat) => (
							<option key={cat} value={cat}>
								{cat}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="pt-8 flex items-center justify-between">
				<button
					onClick={onBack}
					className="text-text-muted hover:text-text transition-colors px-4 py-2"
				>
					Back
				</button>
				<button
					onClick={onNext}
					disabled={!canProceed}
					className="group bg-cta text-white px-8 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
				>
					Next Step
					<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
				</button>
			</div>
		</div>
	);
}
