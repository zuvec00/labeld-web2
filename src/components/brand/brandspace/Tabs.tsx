"use client";

import React, { useState } from "react";
import RadarTab from "./Radar/RadarTab";
import PiecesTab from "./pieces/PiecesTab";
import CollectionsTab from "./collections/CollectionTab";

const TAB_LABELS = ["Radar", "Pieces", "Collections", "Behind the Label"];

export default function BrandTabs({ uid }: { uid: string }) {
	const [tab, setTab] = useState(0);

	return (
		<div className="mt-6">
			{/* Sticky tab bar */}
			<div className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-stroke">
				<div className="overflow-x-auto">
					<div className="flex gap-6 px-4 sm:px-6">
						{TAB_LABELS.map((t, i) => {
							const active = i === tab;
							return (
								<button
									key={t}
									onClick={() => setTab(i)}
									className={[
										"py-4 font-semibold whitespace-nowrap",
										active
											? "text-text border-b-2 border-text"
											: "text-text-muted hover:text-text",
									].join(" ")}
								>
									{t}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="px-4 sm:px-6 py-6">
				{tab === 0 && <RadarTab brandId={uid} isBrand={true} />}
				{tab === 1 && <PiecesTab brandId={uid} />}
				{tab === 2 && <CollectionsTab />}
				{tab === 3 && (
					<div className="text-center text-text-muted">Coming soon</div>
				)}
			</div>
		</div>
	);
}

function Empty({ state }: { state: string }) {
	return (
		<div className="text-text-muted">
			{/* Placeholder; wire actual lists later */}
			Nothing on <span className="text-text font-semibold">{state}</span> yet.
		</div>
	);
}
