// app/(protected)/(dashboard)/settings/page.tsx
"use client";

import ShippingSettings from "@/components/settings/ShippingSettings";

export default function SettingsPage() {
	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-heading font-semibold text-text mb-2">
					Settings
				</h1>
				<p className="text-text-muted">
					Manage your account settings and preferences
				</p>
			</div>

			{/* Shipping Settings */}
			<ShippingSettings />
		</div>
	);
}
