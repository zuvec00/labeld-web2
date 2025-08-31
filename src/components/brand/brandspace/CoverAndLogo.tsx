"use client";

import React from "react";

export function CoverAndLogo({
	coverUrl,
	logoUrl,
	alt = "",
}: {
	coverUrl?: string | null;
	logoUrl: string;
	alt?: string;
}) {
	return (
		<div className="relative">
			{/* Cover */}
			<div
				className="w-full overflow-hidden rounded-[20px]"
				style={{ maxHeight: "65vh" }}
			>
				<img
					src={coverUrl || logoUrl}
					alt={alt}
					className="w-full h-[44vh] sm:h-[54vh] object-cover"
				/>
			</div>

			{/* Logo: half-overlap, above cover */}
			<div className="absolute left-4 sm:left-8 bottom-0 translate-y-1/2 z-10">
				<img
					src={logoUrl}
					alt="Brand logo"
					className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shadow-xl border border-stroke bg-bg"
				/>
			</div>

			{/* Spacer equal to half the logo height so content below doesn't collide */}
			<div className="h-0 sm:h-0" />
		</div>
	);
}

export default CoverAndLogo;
