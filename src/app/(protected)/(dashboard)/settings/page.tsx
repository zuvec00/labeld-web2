// app/(protected)/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	ArrowLeft,
	Shield,
	Truck,
	User,
	Bell,
	CreditCard,
	DollarSign,
} from "lucide-react";
import Button from "@/components/ui/button";
import AccountSecurity from "@/components/settings/AccountSecurity";
import ShippingSettings from "@/components/settings/ShippingSettings";
import PayoutSettings from "@/components/settings/PayoutSettings";

type SettingsSection = "main" | "account-security" | "shipping" | "payout";

export default function SettingsPage() {
	const [currentSection, setCurrentSection] = useState<SettingsSection>("main");
	const router = useRouter();
	const searchParams = useSearchParams();

	// Handle URL parameter for direct navigation to settings sections
	useEffect(() => {
		const section = searchParams.get("section");
		if (section === "shipping") {
			setCurrentSection("shipping");
		} else if (section === "payout") {
			setCurrentSection("payout");
		}
	}, [searchParams]);

	const settingsItems = [
		{
			id: "account-security" as const,
			title: "Account Security",
			description: "Manage your email, password, and authentication settings",
			icon: Shield,
			available: true,
		},
		{
			id: "payout" as const,
			title: "Payout Settings",
			description: "Configure how quickly you receive your earnings",
			icon: DollarSign,
			available: true,
		},
		{
			id: "shipping" as const,
			title: "Shipping Settings",
			description: "Configure your shipping preferences and addresses",
			icon: Truck,
			available: true, // Will be enabled later
		},
		{
			id: "profile" as const,
			title: "Profile Settings",
			description: "Update your personal information and preferences",
			icon: User,
			available: false,
		},
		// {
		// 	id: "notifications" as const,
		// 	title: "Notifications",
		// 	description: "Manage your notification preferences",
		// 	icon: Bell,
		// 	available: false,
		// },
		// {
		// 	id: "billing" as const,
		// 	title: "Billing & Payments",
		// 	description: "Manage your payment methods and billing information",
		// 	icon: CreditCard,
		// 	available: false,
		// },
	];

	const handleBackToMain = () => {
		setCurrentSection("main");
	};

	const handleNavigateToSection = (sectionId: SettingsSection) => {
		setCurrentSection(sectionId);
	};

	if (currentSection === "account-security") {
		return (
			<div className="space-y-6">
				{/* Back Arrow */}
				<button
					onClick={handleBackToMain}
					className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					<span className="text-sm">Back to Settings</span>
				</button>

				{/* Account Security Component */}
				<AccountSecurity />
			</div>
		);
	}

	if (currentSection === "payout") {
		return (
			<div className="space-y-6">
				{/* Back Arrow */}
				<button
					onClick={handleBackToMain}
					className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					<span className="text-sm">Back to Settings</span>
				</button>

				{/* Payout Settings Component */}
				<PayoutSettings />
			</div>
		);
	}

	if (currentSection === "shipping") {
		return (
			<div className="space-y-6">
				{/* Back Arrow */}
				<button
					onClick={handleBackToMain}
					className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					<span className="text-sm">Back to Settings</span>
				</button>

				{/* Shipping Settings Component */}
				<ShippingSettings />
			</div>
		);
	}

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

			{/* Settings Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{settingsItems.map((item) => {
					const Icon = item.icon;
					const isDisabled = !item.available;

					return (
						<button
							key={item.id}
							onClick={() =>
								item.available &&
								handleNavigateToSection(item.id as SettingsSection)
							}
							disabled={isDisabled}
							className={`
								group relative p-6 rounded-2xl border transition-all duration-200 text-left
								${
									isDisabled
										? "bg-cta/5 border-stroke cursor-not-allowed opacity-60"
										: "bg-surface border-stroke hover:border-accent hover:shadow-lg cursor-pointer"
								}
							`}
						>
							{/* Icon */}
							<div
								className={`
								w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
								${
									isDisabled
										? "bg-cta/10 text-text-muted"
										: "bg-accent/10 text-accent group-hover:bg-accent/20"
								}
							`}
							>
								<Icon className="w-6 h-6" />
							</div>

							{/* Content */}
							<div>
								<h3
									className={`
									text-lg font-medium mb-2 transition-colors
									${isDisabled ? "text-text-muted" : "text-text group-hover:text-accent"}
								`}
								>
									{item.title}
								</h3>
								<p className="text-sm text-text-muted leading-relaxed">
									{item.description}
								</p>
							</div>

							{/* Coming Soon Badge */}
							{isDisabled && (
								<div className="absolute top-4 right-4">
									<span className="px-2 py-1 text-xs font-medium bg-cta/10 text-cta rounded-full">
										Coming Soon
									</span>
								</div>
							)}

							{/* Hover Arrow */}
							{!isDisabled && (
								<div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
									<ArrowLeft className="w-4 h-4 text-accent rotate-180" />
								</div>
							)}
						</button>
					);
				})}
			</div>

			{/* Additional Info */}
			<div className="bg-cta/5 rounded-2xl p-6">
				<h3 className="text-lg font-medium text-text mb-2">Need Help?</h3>
				<p className="text-text-muted text-sm mb-4">
					If you need assistance with your account settings or have questions
					about your privacy and security, our support team is here to help.
				</p>
				<a
					href="mailto:support@labeld.app?cc=labeldapp@gmail.com&subject=Support%20Request%20from%20Settings%20Page"
					style={{ display: "inline-block" }}
				>
					<Button text="Contact Support" variant="secondary" />
				</a>
			</div>
		</div>
	);
}
