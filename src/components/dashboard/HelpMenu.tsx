"use client";

import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Play, Check, ShieldBan, ShieldCheck } from "lucide-react";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useTutorial } from "@/hooks/useTutorial";
import type { TourId } from "@/lib/tutorial/types";

export default function HelpMenu() {
	const { activeRole, roleDetection } = useDashboardContext();
	const {
		startTour,
		preferences,
		updatePreferences,
		isTourCompleted,
		isTourDismissed,
		loading,
	} = useTutorial();

	const [open, setOpen] = useState(false);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest(".help-dropdown-container")) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const canRunTours = !preferences?.skipAllTours && !loading;

	const primaryTour: TourId = useMemo(() => {
		return activeRole === "eventOrganizer" ? "event-setup" : "brand-setup";
	}, [activeRole]);

	const organizerReady = !!roleDetection?.hasEventOrganizerProfile;

	const tourItems: Array<{ id: TourId; label: string; description: string; enabled: boolean }> =
		[
			{
				id: "brand-setup",
				label: "Brand Setup Tour",
				description: "Create your brand space and add your first product.",
				enabled: true,
			},
			{
				id: "event-setup",
				label: "Event Setup Tour",
				description: organizerReady
					? "Create your first event and ticket types."
					: "Set up your organizer profile first (required).",
				enabled: organizerReady,
			},
			{
				id: "orders",
				label: "Orders Tour",
				description: "Learn how to track and fulfill orders.",
				enabled: true,
			},
			{
				id: "wallet",
				label: "Wallet & Payouts Tour",
				description: "Understand earnings, payouts, and bank setup.",
				enabled: true,
			},
		];

	function renderTourMeta(tourId: TourId) {
		if (isTourCompleted(tourId)) return <Check className="w-4 h-4 text-cta" />;
		if (isTourDismissed(tourId)) return <span className="text-[10px] text-text-muted">Hidden</span>;
		return null;
	}

	return (
		<div className="relative help-dropdown-container">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="p-2 rounded-lg border border-stroke hover:bg-surface transition-colors text-text"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label="Help"
			>
				<HelpCircle className="w-5 h-5 text-text-muted" />
			</button>

			{open && (
				<div
					className="absolute right-0 mt-2 w-[340px] max-w-[90vw] rounded-xl border border-stroke bg-bg shadow-2xl overflow-hidden z-50"
					role="menu"
				>
					<div className="p-4 border-b border-stroke">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="font-heading font-semibold text-text">Help</p>
								<p className="text-xs text-text-muted mt-0.5">
									Run a guided tour anytime. Always skippable.
								</p>
							</div>
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="text-xs text-text-muted hover:text-text transition-colors"
							>
								Close
							</button>
						</div>

						<div className="mt-3 flex items-center justify-between gap-3">
							<button
								type="button"
								disabled={!canRunTours || (primaryTour === "event-setup" && !organizerReady)}
								onClick={() => {
									setOpen(false);
									startTour(primaryTour);
								}}
								className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-cta text-text font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cta/90 transition-colors text-sm"
							>
								<Play className="w-4 h-4" />
								Start Tutorial
							</button>

							<button
								type="button"
								disabled={loading}
								onClick={async () => {
									const next = !(preferences?.skipAllTours ?? false);
									await updatePreferences({ skipAllTours: next });
								}}
								className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stroke hover:bg-surface transition-colors text-sm disabled:opacity-50"
							>
								{preferences?.skipAllTours ? (
									<>
										<ShieldBan className="w-4 h-4 text-text-muted" />
										<span className="text-text-muted">Tours off</span>
									</>
								) : (
									<>
										<ShieldCheck className="w-4 h-4 text-text-muted" />
										<span className="text-text-muted">Tours on</span>
									</>
								)}
							</button>
						</div>
					</div>

					<div className="p-2">
						{tourItems.map((t) => {
							const disabled =
								!canRunTours || !t.enabled || preferences?.skipAllTours === true;

							return (
								<button
									key={t.id}
									type="button"
									role="menuitem"
									disabled={disabled}
									onClick={() => {
										setOpen(false);
										startTour(t.id);
									}}
									className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-sm font-medium text-text">{t.label}</p>
											<p className="text-xs text-text-muted mt-0.5">
												{t.description}
											</p>
										</div>
										<div className="mt-0.5">{renderTourMeta(t.id)}</div>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}


