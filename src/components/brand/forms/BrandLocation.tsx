"use client";

import { useMemo } from "react";
import { useBrandOnboard } from "@/lib/stores/brandOnboard";
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

export default function BrandLocationForm() {
	const { brandName, country, state, set } = useBrandOnboard();

	// Build a normalized map: { [countryName]: [stateName, ...] }
	const { COUNTRY_LIST, COUNTRY_TO_STATES } = useMemo(() => {
		const payload = countriesJson as CountriesPayload;
		const list = (payload.data ?? []).map((c) => c.name);
		const map: Record<string, string[]> = {};
		for (const c of payload.data ?? []) {
			map[c.name] = (c.states ?? [])
				.map((s) => s?.name)
				.filter(Boolean) as string[];
		}
		return { COUNTRY_LIST: list, COUNTRY_TO_STATES: map };
	}, []);

	const states = country ? COUNTRY_TO_STATES[country] ?? [] : [];

	return (
		<div>
			<h3 className="font-heading font-semibold text-2xl">Location</h3>
			<p className="text-text-muted mt-1">
				Let fans find{" "}
				<span className="text-cta font-semibold">
					{brandName?.trim() || "your brand"}
				</span>{" "}
				no matter where they are.
			</p>

			<div className="mt-5 rounded-2xl bg-surface border border-stroke p-6">
				{/* Country */}
				<div className="mt-5">
					<label className="block text-sm text-text-muted mb-1">Country</label>
					<select
						value={country ?? ""}
						onChange={(e) => {
							set("country", e.target.value || null);
							set("state", null); // reset state on country change
						}}
						className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent"
					>
						<option value="">Choose your country</option>
						{COUNTRY_LIST.map((c, idx) => (
							<option key={`${c}-${idx}`} value={c}>
								{c}
							</option>
						))}
					</select>
				</div>

				{/* State */}
				<div className="mt-4">
					<label className="block text-sm text-text-muted mb-1">State</label>
					<select
						value={state ?? ""}
						onChange={(e) => set("state", e.target.value || null)}
						disabled={!country}
						className="w-full rounded-xl border border-stroke px-4 py-3 text-text outline-none focus:border-accent disabled:opacity-50"
					>
						<option value="">
							{country ? "Where are you based?" : "Select country first"}
						</option>
						{states.map((s, idx) => (
							<option key={`${country}-${s}-${idx}`} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
}
