// src/app/(dashboard)/layout.tsx
"use client";

import Sidebar from "@/components/dashboard/SideBar";
import MobileSidebar from "@/components/dashboard/MobileSidebar";
import Topbar from "@/components/dashboard/Topbar";
import GlobalUploadIndicator from "@/components/ui/GlobalUploadIndicator";
import { Toaster } from "@/components/ui/toast";
import { useState, useEffect } from "react";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import AcquisitionSurveyModal from "@/components/modals/AcquisitionSurveyModal";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const { activeRole, roleDetection } = useDashboardContext();
	const [showSurvey, setShowSurvey] = useState(false);

	useEffect(() => {
		// Only show for brands
		if (activeRole !== "brand" || !roleDetection) return;

		// Check if survey already completed or skipped
		// roleDetection is BrandModel
		if (!roleDetection.acquisitionSurvey) {
			// Add a small delay so it doesn't pop up INSTANTLY on load
			const timer = setTimeout(() => setShowSurvey(true), 1500);
			return () => clearTimeout(timer);
		}
	}, [activeRole, roleDetection]);

	return (
		<div className="min-h-dvh bg-bg text-text">
			{/* Mobile Sidebar */}
			<MobileSidebar open={isMobileMenuOpen} setOpen={setIsMobileMenuOpen} />

			<div className="flex h-screen overflow-hidden">
				{/* Desktop Sidebar - fixed width, full height */}
				<aside className="hidden lg:block w-[270px] flex-shrink-0 h-full bg-surface z-40">
					<Sidebar />
				</aside>

				{/* Main Content Area (Topbar + Page Content) */}
				<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
					{/* Top bar */}
					<header className="flex-shrink-0 bg-surface/80 backdrop-blur-md border-b border-stroke h-16 w-full z-30">
						<Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
					</header>

					{/* Scrollable Content */}
					<main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
						{/* Wrapper for max width constraint if desired */}
						<div className="w-full max-w-[1600px] mx-auto">{children}</div>
					</main>
				</div>
			</div>

			{/* Global Upload Indicator */}
			<GlobalUploadIndicator />

			{/* Toast notifications */}
			<Toaster />

			{/* Acquisition Survey */}
			<AcquisitionSurveyModal
				isOpen={showSurvey}
				onClose={() => setShowSurvey(false)}
			/>
		</div>
	);
}
