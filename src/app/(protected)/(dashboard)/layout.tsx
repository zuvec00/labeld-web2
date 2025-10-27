// src/app/(dashboard)/layout.tsx
"use client";

import Sidebar from "@/components/dashboard/SideBar";
import Topbar from "@/components/dashboard/Topbar";
import GlobalUploadIndicator from "@/components/ui/GlobalUploadIndicator";
import { Toaster } from "@/components/ui/toast";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-dvh bg-bg text-text p-4 sm:p-6 lg:p-8">
			{/* Top bar spans full width */}
			<header className="sticky top-0 z-30 bg-surface border border-stroke rounded-[20px]">
				<Topbar />
			</header>

			{/* Page body: sidebar + content live BELOW the topbar */}
			<div className="mt-6">
				{/* max-w-[1400px] */}
				<div className="mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
					{/* Sidebar card - fixed height and sticky */}
					<aside className="lg:h-[calc(100vh-120px)] lg:sticky lg:top-6">
						<div className="w-full h-full rounded-[20px] bg-surface border border-stroke overflow-hidden">
							<Sidebar />
						</div>
					</aside>

					{/* Main content area */}
					<main className="min-h-[70vh]">{children}</main>
				</div>
			</div>

			{/* Global Upload Indicator - shows across all dashboard pages */}
			<GlobalUploadIndicator />

			{/* Toast notifications */}
			<Toaster />
		</div>
	);
}
