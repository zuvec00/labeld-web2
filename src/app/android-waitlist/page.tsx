import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import Footer from "@/components/landing-page/Footer";
import { AndroidWaitlistForm } from "./AndroidWaitlistForm";

export const metadata: Metadata = {
	metadataBase: new URL("https://studio.labeld.app"),
	title: "Labeld Studio Android Waitlist",
	description:
		"Join the Labeld Studio Android testing list for early Play Store access.",
	alternates: {
		canonical: "https://studio.labeld.app/android-waitlist",
	},
	openGraph: {
		title: "Labeld Studio Android Waitlist",
		description:
			"Get early Android testing access to Labeld Studio before the Play Store production release.",
		type: "website",
		url: "https://studio.labeld.app/android-waitlist",
		siteName: "Labeld Studio",
		images: [
			{
				url: "/images/onboarding-hero.JPEG",
				width: 1200,
				height: 630,
				alt: "Labeld Studio Android Waitlist",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Labeld Studio Android Waitlist",
		description:
			"Join the Android testing list for early access to Labeld Studio.",
		images: ["/images/onboarding-hero.JPEG"],
	},
};

const steps = [
	"Join with the email you use for Google Play.",
	"We add approved testers to the Play Console testing list.",
	"You receive testing updates and production launch notes by email.",
];

export default function AndroidWaitlistPage() {
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
								Android testing / Labeld Studio
							</p>
							<h1 className="max-w-4xl font-heading text-[clamp(2.35rem,5vw,5rem)] font-semibold uppercase leading-[1.02] tracking-normal text-foreground">
								Help bring Studio to Android.
							</h1>
							<p className="mt-6 max-w-xl font-body text-base leading-8 text-muted-foreground">
								We are preparing Labeld Studio for Play Store production. Join
								the tester list with the Google email you want us to add, and
								we will send access notes as the testing window moves.
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
								href="https://apps.apple.com/ng/app/labeld-studio/id6760316742"
								target="_blank"
								className="mt-9 inline-flex items-center gap-2 font-body text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-cta"
							>
								Already on iPhone? Download Studio for iOS
								<ArrowUpRight className="h-4 w-4" />
							</Link>
						</div>

						<div className="relative">
							<div className="mb-4 border border-border bg-surface p-5 shadow-2xl shadow-black/5">
								<p className="font-body text-[10px] font-bold uppercase tracking-[0.28em] text-cta">
									Testing note
								</p>
								<p className="mt-3 font-body text-sm leading-7 text-muted-foreground">
									Use a real Google Play email. That is the account we will add
									to the Android test track before production access opens.
								</p>
							</div>
							<AndroidWaitlistForm />
						</div>
					</div>
				</section>

				<section className="mx-auto grid max-w-7xl gap-6 px-6 py-12 md:grid-cols-3">
					{[
						["Why Android", "More founders run their brand from Android than the old ecosystem admits."],
						["What you get", "Testing access, product notes, and launch updates from the Studio team."],
						["What we need", "Real usage, sharp feedback, and enough testers for Play Store review."],
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
