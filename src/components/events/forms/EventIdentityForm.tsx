"use client";

import { useEventOrganizerOnboard } from "@/lib/stores/eventOrganizerStore";

const EVENT_CATEGORIES = [
	"Festival",
	"Pop-up",
	"Fashion Show",
	"Nightlife",
	"Art & Culture",
	"University Event",
	"Others",
];

export default function EventIdentityForm() {
	const { data, setData } = useEventOrganizerOnboard();

	return (
		<div className="rounded-2xl bg-surface border border-stroke px-6 py-6">
			{/* Organizer Name */}
			<div className="">
				<label className="block text-sm text-text-muted mb-1">
					Organizer Name <span className="text-cta">*</span>
				</label>
				<input
					value={data.organizerName}
					onChange={(e) => setData({ organizerName: e.target.value })}
					placeholder="e.g. ALT Lagos, Rave District, Studio24 Events"
					className="w-full rounded-xl border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
				/>
			</div>

			{/* Username */}
			<div className="mt-4">
				<label className="block text-sm text-text-muted mb-1">
					Username / Handle <span className="text-cta">*</span>
				</label>
				<input
					value={data.organizerUsername}
					onChange={(e) => setData({ organizerUsername: e.target.value })}
					placeholder="@altlagos"
					className="w-full rounded-xl border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
				/>
			</div>

			{/* Category */}
			<div className="mt-4">
				<label className="block text-sm text-text-muted mb-1">
					Event Category <span className="text-cta">*</span>
				</label>
				<select
					value={data.eventCategory ?? ""}
					onChange={(e) => setData({ eventCategory: e.target.value || "" })}
					className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
				>
					<option value="" disabled>
						Pick what fits your events the most
					</option>
					{EVENT_CATEGORIES.map((category) => (
						<option
							key={category}
							value={category.toLowerCase().replace(/\s+/g, "-")}
						>
							{category}
						</option>
					))}
				</select>
			</div>
		</div>
	);
}
