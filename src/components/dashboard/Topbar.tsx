"use client";

import Image from "next/image";

export default function Topbar() {
	return (
		<div className="h-16 sm:h-18 flex items-center gap-3 px-4 sm:px-6 lg:px-8">
			<div className="flex items-center gap-2">
				<Image
					src="/1.svg"
					alt="Labeld"
					width={16}
					height={16}
					className="h-16 w-16"
				/>
			</div>
			{/* Search */}
			<div className="flex-1">
				<div className="hidden md:flex items-center gap-2 rounded-xl bg-surface border border-stroke px-3 py-2">
					<span className="text-text-muted">🔎</span>
					<input
						placeholder="Search anything…"
						className="bg-transparent outline-none w-full placeholder:text-text-muted"
					/>
					<kbd className="hidden md:inline-block text-xs text-text-muted">
						/
					</kbd>
				</div>
			</div>

			{/* Right actions */}
			<div className="flex items-center gap-2">
				<button className="rounded-xl border border-stroke px-3 py-2 hover:bg-surface">
					⚙️
				</button>
				<button className="rounded-xl border border-stroke px-3 py-2 hover:bg-surface">
					🔔
				</button>
				<div className="h-9 w-9 rounded-full overflow-hidden border border-stroke">
					<Image
						src="/images/onboarding-hero.jpeg"
						alt=""
						width={36}
						height={36}
						className="object-cover h-full w-full"
					/>
				</div>
			</div>
		</div>
	);
}
