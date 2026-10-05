import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import Footer from "@/components/landing-page/Footer";
import AppleIcon from "@/components/ui/AppleIcon";
import GooglePlayIcon from "@/components/ui/GooglePlayIcon";
import { STUDIO_ANDROID_URL, STUDIO_IOS_URL } from "@/lib/appLinks";

export const metadata: Metadata = {
	metadataBase: new URL("https://studio.labeld.app"),
	title: "Labeld Studio is now on Google Play",
	description:
		"Labeld Studio is live on Google Play. Run your brand, drops, orders and events from your Android phone.",
	alternates: {
		canonical: "https://studio.labeld.app/android-waitlist",
	},
	openGraph: {
		title: "Labeld Studio is now on Google Play",
		description:
			"Labeld Studio is live on Google Play. Run your brand from your Android phone.",
		type: "website",
		url: "https://studio.labeld.app/android-waitlist",
		siteName: "Labeld Studio",
		images: [
			{
				url: "/images/onboarding-hero.JPEG",
				width: 1200,
				height: 630,
				alt: "Labeld Studio on Google Play",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Labeld Studio is now on Google Play",
		description:
			"Labeld Studio is live on Google Play.",
		images: ["/images/onboarding-hero.JPEG"],
	},
};

const steps = [
	"Download Labeld Studio from Google Play.",
	"Sign in with the same account you use on Studio web.",
	"Manage drops, orders, events and your storefront on the go.",
];

export default function AndroidPage() {
	return (
		<div className="min-h-screen bg-bg text-foreground">
			<header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-xl">
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
					<Link
						href="/"
						className="font-heading text-lg font-bold tracking-tight text-foreground"
					>
						LABELD
					</Link>
					<div className="flex items-center gap-5">
						<Link
							href="/pricing"
							className="hidden font-body text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
						>
							Pricing
						</Link>
						<Link
							href="/login"
							className="bg-cta px-4 py-2 font-heading text-xs uppercase tracking-[0.14em] text-white transition hover:bg-cta/90"
						>
							Open Studio
						</Link>
					</div>
				</div>
			</header>

			<main className="relative overflow-hidden pt-16">
				<section className="relative border-b border-border bg-bg">
					<div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
					<div className="absolute left-0 top-16 h-80 w-80 bg-cta/10 blur-3xl" />
					<div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-28">
						<div>
							<p className="mb-5 font-body text-[11px] font-bold uppercase tracking-[0.28em] text-cta">
								Now on Google Play / Labeld Studio
							</p>
							<h1 className="max-w-4xl font-heading text-[clamp(2.35rem,5vw,5rem)] font-semibold uppercase leading-[1.02] tracking-normal text-foreground">
								Studio is now on Android.
							</h1>
							<p className="mt-6 max-w-xl font-body text-base leading-8 text-muted-foreground">
								Labeld Studio is live on Google Play. Run your brand, drops,
								orders and events from your Android phone, synced with Studio
								web.
							</p>

							<div className="mt-8 grid gap-3">
								{steps.map((step) => (
									<div key={step} className="flex items-start gap-3">
										<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cta" />
										<p className="font-body text-sm leading-6 text-muted-foreground">
											{step}
										</p>
									</div>
								))}
							</div>

							<Link
								href={STUDIO_IOS_URL}
								target="_blank"
								className="mt-9 inline-flex items-center gap-2 font-body text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-cta"
							>
								On iPhone? Get Studio on the App Store
								<ArrowUpRight className="h-4 w-4" />
							</Link>
						</div>

						<div className="relative">
							<div className="mb-4 border border-border bg-surface p-5 shadow-2xl shadow-black/5">
								<p className="font-body text-[10px] font-bold uppercase tracking-[0.28em] text-cta">
									Get the app
								</p>
								<p className="mt-3 font-body text-sm leading-7 text-muted-foreground">
									Free to download. Same account, same brand, same data as
									Studio web.
								</p>
								<div className="mt-5 grid gap-3 sm:grid-cols-2">
									<Link
										href={STUDIO_ANDROID_URL}
										target="_blank"
										className="inline-flex items-center justify-center gap-2 bg-cta px-5 py-3 font-heading text-xs uppercase tracking-[0.14em] text-white transition hover:bg-cta/90"
									>
										<GooglePlayIcon className="h-4 w-4" />
										Google Play
									</Link>
									<Link
										href={STUDIO_IOS_URL}
										target="_blank"
										className="inline-flex items-center justify-center gap-2 border border-border bg-bg px-5 py-3 font-heading text-xs uppercase tracking-[0.14em] text-foreground transition hover:bg-surface"
									>
										<AppleIcon className="h-4 w-4" />
										App Store
									</Link>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="mx-auto grid max-w-7xl gap-6 px-6 py-12 md:grid-cols-3">
					{[
						["Why Android", "More founders run their brand from Android than the old ecosystem admits."],
						["What you get", "Drops, orders, events, storefront edits and sales alerts in your pocket."],
						["Built with testers", "Shaped by the founders who tested Studio on Android before launch."],
					].map(([title, body]) => (
						<div key={title} className="border-t border-border pt-5">
							<h2 className="font-heading text-sm font-semibold uppercase text-foreground">
								{title}
							</h2>
							<p className="mt-3 font-body text-sm leading-7 text-muted-foreground">
								{body}
							</p>
						</div>
					))}
				</section>
			</main>

			<Footer />
		</div>
	);
}
