"use client";

import { useDashboardContext } from "@/hooks/useDashboardContext";
// import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import {
	Lock,
	Sparkles,
	LayoutTemplate,
	Globe,
	CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

// Mock templates for the UI
const MOCK_TEMPLATES = [
	{
		id: "nightlife",
		name: "After Hours",
		description: "Dark, energetic vibe for clubs and parties.",
		vibe: "Nightlife",
	},
	{
		id: "social",
		name: "Socialite",
		description: "Clean, photo-first layout for brunches and mixers.",
		vibe: "Social",
	},
	{
		id: "corporate",
		name: "Summit",
		description: "Professional and crisp for conferences and meetups.",
		vibe: "Corporate",
	},
	{
		id: "festival",
		name: "Headliner",
		description: "Bold typography and loud colors for festivals.",
		vibe: "Festival",
	},
];

export default function EventSiteCustomizationPage() {
	const { roleDetection, loading } = useDashboardContext();
	const [devTemplates, setDevTemplates] = useState<any[]>([]);

	if (loading) return <div className="p-8">Loading...</div>;

	// Default to "free" if not specified
	const subscriptionTier = roleDetection?.eventSubscriptionTier || "free";
	const isPro = subscriptionTier === "pro";
	const eventSlug = roleDetection?.eventSlug || "your-slug";

	// Dev mode check
	const isDev = process.env.NODE_ENV === "development";

	const handleSeedTemplates = () => {
		setDevTemplates(MOCK_TEMPLATES);
		// In a real implementation, this might confirm with a toast
		console.log("Seeded templates to local state");
	};

	// Determine functionality based on dev seed or static list
	const templates =
		isDev && devTemplates.length > 0 ? devTemplates : MOCK_TEMPLATES;

	return (
		<div className="p-6 lg:p-12 max-w-6xl mx-auto space-y-12">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold mb-2">Event Site Customization</h1>
				<p className="text-text-muted">
					Manage your dedicated experience website presence.
				</p>
			</div>

			{/* SECTION 1: Experience Website Status (All Users) */}
			<section className="bg-surface border border-stroke rounded-xl p-6 lg:p-8">
				<div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
					<div className="space-y-4 max-w-2xl">
						<div className="flex items-center gap-3">
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center ${
									isPro
										? "bg-primary/10 text-primary"
										: "bg-bg-subtle text-text-muted"
								}`}
							>
								<Globe className="w-5 h-5" />
							</div>
							<div>
								<h2 className="text-lg font-semibold">
									{isPro
										? "Experience Website Active"
										: "Experience Website: Inactive"}
								</h2>
								<p className="text-sm text-text-muted">
									{isPro
										? "Your site showcases all published events and supports ticket sales."
										: "Your events are currently published on events.labeld.app."}
								</p>
							</div>
						</div>

						{isPro && (
							<div className="p-4 bg-bg-subtle rounded-lg border border-stroke flex items-center gap-3">
								<span className="text-sm font-mono text-text-muted">
									https://{eventSlug}.labeld.app
								</span>
								<Badge variant="success" className="text-xs">
									Live
								</Badge>
							</div>
						)}
					</div>

					<div className="flex-shrink-0">
						{!isPro && (
							<div className="flex flex-col gap-3 items-start md:items-end">
								<p className="text-sm text-text-muted max-w-xs md:text-right">
									Upgrade to Pro to launch your own dedicated event website.
								</p>
								{/* Access Paystack UI or navigate to settings (Placeholder CTA) */}
								<Button text="Upgrade to Pro" variant="primary" />
							</div>
						)}
					</div>
				</div>
			</section>

			{/* SECTION 2: Experience Templates (Pro-Oriented) */}
			<section>
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-xl font-bold flex items-center gap-2">
							<LayoutTemplate className="w-5 h-5" /> Experience Templates
						</h2>
						<p className="text-text-muted mt-1">
							Select the vibe that matches your events.
						</p>
					</div>
					{isDev && (
						<Button
							text="Seed Experience Templates (Dev)"
							variant="secondary"
							onClick={handleSeedTemplates}
							className="text-xs h-8"
						/>
					)}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{templates.map((template) => (
						<div
							key={template.id}
							className={`relative group rounded-xl border border-stroke overflow-hidden transition-all ${
								isPro ? "hover:border-primary/50 hover:shadow-md" : "opacity-75"
							}`}
						>
							{/* Mock Thumbnail */}
							<div className="bg-bg-subtle h-40 w-full flex items-center justify-center relative">
								<Sparkles className="w-8 h-8 text-text-muted/30" />

								{!isPro && (
									<div className="absolute inset-0 bg-bg/50 backdrop-blur-[2px] flex items-center justify-center p-4 text-center">
										<div className="bg-surface/90 p-2 rounded-lg shadow-sm border border-stroke">
											<Lock className="w-4 h-4 mx-auto mb-1 text-text-muted" />
											<span className="text-xs font-semibold">Pro Feature</span>
										</div>
									</div>
								)}
							</div>

							<div className="p-4">
								<div className="flex justify-between items-start mb-2">
									<h3 className="font-semibold">{template.name}</h3>
									{isPro && (
										<Badge variant="secondary" className="text-[10px]">
											Available
										</Badge>
									)}
								</div>
								<p className="text-xs text-text-muted mb-4 line-clamp-2">
									{template.description}
								</p>

								<Button
									text={isPro ? "Preview" : "Locked"}
									variant="secondary"
									className="w-full text-xs"
									disabled={!isPro}
								/>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* SECTION 3: Experience Capabilities (Read-Only) */}
			<section className="bg-bg-subtle/50 rounded-xl p-6 lg:p-8 border border-stroke border-dashed">
				<h2 className="text-lg font-bold mb-6">Experience Capabilities</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
					{[
						"Dedicated experience website",
						"Custom hero banner & branding",
						"Event ordering & featured events",
						"Optimized ticket flow",
						"Mobile-first guest experience",
						"Reduced Labeld branding",
					].map((capability, i) => (
						<div key={i} className="flex items-center gap-3">
							<div
								className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
									isPro
										? "bg-green-500/10 text-green-600"
										: "bg-stroke text-text-muted"
								}`}
							>
								{isPro ? (
									<CheckCircle2 className="w-3 h-3" />
								) : (
									<Lock className="w-3 h-3" />
								)}
							</div>
							<span
								className={`text-sm ${isPro ? "text-text" : "text-text-muted"}`}
							>
								{capability}
							</span>
						</div>
					))}
				</div>
				<div className="mt-6 pt-6 border-t border-stroke border-dashed">
					<p className="text-xs text-text-muted">
						{isPro
							? "All capabilities are currently active for your account."
							: "These advanced features are available exclusively to Pro tier organizers."}
					</p>
				</div>
			</section>
		</div>
	);
}
