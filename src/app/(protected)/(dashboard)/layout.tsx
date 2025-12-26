// src/app/(dashboard)/layout.tsx
"use client";

import Sidebar from "@/components/dashboard/SideBar";
import MobileSidebar from "@/components/dashboard/MobileSidebar";
import Topbar from "@/components/dashboard/Topbar";
import GlobalUploadIndicator from "@/components/ui/GlobalUploadIndicator";
import { Toaster } from "@/components/ui/toast";
import { useState } from "react";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	return (
		<div className="min-h-dvh bg-bg text-text">
			{/* Mobile Sidebar */}
			<MobileSidebar open={isMobileMenuOpen} setOpen={setIsMobileMenuOpen} />

			<div className="flex h-screen overflow-hidden">
				{/* Desktop Sidebar - fixed width, full height */}
				<aside className="hidden lg:block w-[260px] flex-shrink-0 h-full bg-surface z-40">
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
		</div>
	);
}
