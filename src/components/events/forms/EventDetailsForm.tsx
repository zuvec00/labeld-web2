"use client";

import { useEventOrganizerOnboard } from "@/lib/stores/eventOrganizerStore";

const CITIES = [
	"Lagos",
	"Abuja",
	"Accra",
	"Kinshasa",
	"Nairobi",
	"Johannesburg",
	"Cairo",
	"Casablanca",
	"Tunis",
	"Addis Ababa",
	"Kampala",
	"Kigali",
	"Dar es Salaam",
	"Other",
];

const YEARS = Array.from(
	{ length: 20 },
	(_, i) => new Date().getFullYear() - i
);

export default function EventDetailsForm() {
	const { data, setData } = useEventOrganizerOnboard();

	return (
		<div>
			<p className="text-text-muted mt-1">
				Help people find{" "}
				<span className="text-cta font-semibold">
					{data.organizerName?.trim() || "your events"}
				</span>{" "}
				and connect with you.
			</p>

			<div className="mt-5 rounded-2xl bg-surface border border-stroke p-6">
				{/* Location & Reach */}
				<div className="">
					<label className="block text-sm text-text-muted mb-1">
						Base City{" "}
						<span className="text-xs text-text-muted">(optional)</span>
					</label>
					<select
						value={data.baseCity ?? ""}
						onChange={(e) => setData({ baseCity: e.target.value || "" })}
						className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
					>
						<option value="">Select your base city</option>
						{CITIES.map((city) => (
							<option key={city} value={city.toLowerCase()}>
								{city}
							</option>
						))}
					</select>
				</div>

				<div className="mt-4">
					<label className="block text-sm text-text-muted mb-1">
						Active Since{" "}
						<span className="text-xs text-text-muted">(optional)</span>
					</label>
					<select
						value={data.activeSince ?? ""}
						onChange={(e) => setData({ activeSince: e.target.value || "" })}
						className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
					>
						<option value="">Select year</option>
						{YEARS.map((year) => (
							<option key={year} value={year.toString()}>
								{year}
							</option>
						))}
					</select>
				</div>

				<hr className="my-6 border-stroke" />

				{/* Contact & Social Links */}
				<div className="grid grid-cols-1 gap-4">
					<div>
						<label className="block text-sm text-text-muted mb-1">
							Official Email{" "}
							<span className="text-xs text-text-muted">(optional)</span>
						</label>
						<input
							type="email"
							value={data.email}
							onChange={(e) => setData({ email: e.target.value })}
							placeholder="contact@yourevent.com"
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
						/>
					</div>

					<div>
						<label className="block text-sm text-text-muted mb-1">
							Phone Number{" "}
							<span className="text-xs text-text-muted">(optional)</span>
						</label>
						<input
							type="tel"
							value={data.phone}
							onChange={(e) => setData({ phone: e.target.value })}
							placeholder="+234 800 000 0000"
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
						/>
					</div>

					<div>
						<label className="block text-sm text-text-muted mb-1">
							Instagram{" "}
							<span className="text-xs text-text-muted">(optional)</span>
						</label>
						<input
							value={data.instagram}
							onChange={(e) => setData({ instagram: e.target.value })}
							placeholder="@yourevent"
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
						/>
					</div>

					<div>
						<label className="block text-sm text-text-muted mb-1">
							TikTok <span className="text-xs text-text-muted">(optional)</span>
						</label>
						<input
							value={data.tiktok}
							onChange={(e) => setData({ tiktok: e.target.value })}
							placeholder="@yourevent"
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
						/>
					</div>

					<div>
						<label className="block text-sm text-text-muted mb-1">
							X/Twitter{" "}
							<span className="text-xs text-text-muted">(optional)</span>
						</label>
						<input
							value={data.twitter}
							onChange={(e) => setData({ twitter: e.target.value })}
							placeholder="@yourevent"
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
						/>
					</div>

					<div>
						<label className="block text-sm text-text-muted mb-1">
							Website{" "}
							<span className="text-xs text-text-muted">(optional)</span>
						</label>
						<input
							type="url"
							value={data.website}
							onChange={(e) => setData({ website: e.target.value })}
							placeholder="https://yourevent.com"
							className="w-full rounded-xl border border-stroke px-4 py-3 text-text placeholder:text-text-muted focus:border-accent outline-none"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
