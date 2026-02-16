"use client";

/* eslint-disable @next/next/no-img-element */
import { Instagram } from "lucide-react";
import Link from "next/link";
import { GradientText } from "@/components/ui/GradientText";
import { subscribeToNewsletter } from "@/lib/firebase/queries/newsletter";
import { useState } from "react";

export default function Footer() {
	const [email, setEmail] = useState("");
	const [isSubscribing, setIsSubscribing] = useState(false);
	const [subscriptionMessage, setSubscriptionMessage] = useState("");

	const handleNewsletterSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email.trim()) {
			setSubscriptionMessage("Please enter a valid email address.");
			return;
		}

		setIsSubscribing(true);
		setSubscriptionMessage("");

		try {
			const result = await subscribeToNewsletter(email, "footer");
			setSubscriptionMessage(result.message);

			if (result.success) {
				setEmail("");
			}
		} catch (error) {
			console.error("Newsletter subscription error:", error);
			setSubscriptionMessage("An error occurred. Please try again later.");
		} finally {
			setIsSubscribing(false);
		}
	};

	return (
		<footer className="mt-16 bg-cta/10 border-t border-stroke">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Main Footer Content */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
					{/* Brand Section */}
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<img
								src="/labeld_logo.png"
								alt="Labeld Logo"
								className="w-8 h-8"
							/>
							<GradientText text="LABELD STUDIO" className="font-heading text-2xl"/>
						</div>
						<p className="text-text-muted text-sm font-manrope leading-relaxed">
							Labeld Studio is the official platform by Labeld for independent
							fashion brands and event organizers, connecting culture-led
							creators with real fans.
						</p>

						{/* Newsletter Subscription */}
						<div className="space-y-3">
							<h4 className="text-accent font-manrope font-semibold text-sm">
								Stay Updated
							</h4>
							<p className="text-text-muted text-xs font-manrope">
								Get notified about new drops, brands, and exclusive releases
							</p>
							<form onSubmit={handleNewsletterSubmit} className="space-y-2">
								<div className="flex gap-2">
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="Your email address"
										className="flex-1 px-3 py-2 text-sm border border-stroke rounded-md text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent font-manrope"
										disabled={isSubscribing}
									/>
									<button
										type="submit"
										disabled={isSubscribing}
										className="px-4 py-2 bg-cta hover:bg-accent/90 hover:text-bg disabled:bg-cta/50 text-white text-sm font-manrope rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cta focus:ring-offset-2 focus:ring-offset-bg"
									>
										{isSubscribing ? "..." : "Subscribe"}
									</button>
								</div>
								{subscriptionMessage && (
									<p
										className={`text-xs font-manrope ${
											subscriptionMessage.includes("Successfully")
												? "text-green-500"
												: "text-red-500"
										}`}
									>
										{subscriptionMessage}
									</p>
								)}
							</form>
						</div>
					</div>

					{/* Company Links */}
					<div className="space-y-4">
						<h3 className="text-lg font-heading font-semibold text-cta">
							Company
						</h3>
						<div className="space-y-2">
							<a
								href="https://labeld.app"
								target="_blank"
								rel="noopener noreferrer"
								className="block text-text-muted hover:text-cta transition-colors text-sm font-manrope"
							>
								About Us
							</a>
							<a
								href="https://studio.labeld.app/"
								target="_blank"
								rel="noopener noreferrer"
								className="block text-text-muted hover:text-accent transition-colors text-sm font-manrope"
							>
								Labeld Studio
							</a>
							<a
								href="https://events.labeld.app/discover"
								target="_blank"
								rel="noopener noreferrer"
								className="block text-text-muted hover:text-events transition-colors text-sm font-manrope"
							>
								Labeld Events
							</a>
							<a
								href="https://apps.apple.com/ng/app/labeld/id6748664223"
								target="_blank"
								rel="noopener noreferrer"
								className="block text-text-muted hover:text-cta transition-colors text-sm font-manrope"
							>
								Download iOS App
							</a>
							<a
								href="https://labeld.app"
								target="_blank"
								rel="noopener noreferrer"
								className="block text-text-muted hover:text-cta transition-colors text-sm font-manrope"
							>
								Join Android Waitlist
							</a>
						</div>
					</div>

					{/* Support Section */}
					<div className="space-y-4">
						<h3 className="text-lg font-heading font-semibold text-cta">
							Support
						</h3>
						<div className="space-y-2">
							<p className="text-text-muted text-sm font-manrope">
								Need help? Contact our support team:
							</p>
							<a
								href="mailto:support@labeld.app?cc=labeldapp@gmail.com"
								className="block text-text-muted hover:text-cta transition-colors text-sm font-manrope"
							>
								support@labeld.app
							</a>
							<p className="text-text-muted text-xs font-manrope">
								We typically respond within 24 hours
							</p>
						</div>
					</div>

					{/* Social Links */}
					<div className="space-y-4">
						<h3 className="text-lg font-heading font-semibold text-cta">
							Follow Us
						</h3>
						<div className="flex items-center space-x-4">
							<a
								href="https://twitter.com/labeldapp"
								className="text-text-muted hover:text-cta transition-colors"
								target="_blank"
								rel="noopener noreferrer"
							>
								<svg
									className="h-5 w-5"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</a>
							<a
								href="https://www.instagram.com/labeld.app/"
								className="text-text-muted hover:text-cta transition-colors"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Instagram className="h-5 w-5" />
							</a>
							<a
								href="https://www.tiktok.com/@labeldapp"
								className="text-text-muted hover:text-cta transition-colors"
								target="_blank"
								rel="noopener noreferrer"
							>
								<svg
									className="h-5 w-5"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
								</svg>
							</a>
						</div>
					</div>
				</div>

				{/* Bottom Section */}
				<div className="border-t border-stroke pt-6">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
						<div className="text-text-muted text-sm font-manrope">
							© 2025 Labeld. All rights reserved.
						</div>
						<div className="flex items-center space-x-6">
							<Link
								href="/terms"
								className="text-text-muted hover:text-cta transition-colors text-sm font-manrope"
							>
								Terms & Conditions
							</Link>
							<Link
								href="/privacy"
								className="text-text-muted hover:text-cta transition-colors text-sm font-manrope"
							>
								Privacy Policy
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
