"use client";

import { ButtonVite } from "@/components/ui/buttonVite";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Smartphone } from "lucide-react";

const productChips = ["Storefronts", "Drops", "Events", "Orders"];
const proofPoints = [
	"Custom brand sites",
	"Ticketed experiences",
	"Orders, analytics, and payouts",
];

const Hero = () => {
	const router = useRouter();

	return (
		<section
			className="relative overflow-hidden border-b border-border bg-bg px-5 pb-16 pt-24 sm:px-6 md:pb-20 md:pt-28"
		>
			<div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
			<div className="absolute right-0 top-24 h-72 w-72 bg-cta/10 blur-3xl" />

			<div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] xl:gap-14">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7 }}
					className="max-w-xl"
				>
					<p className="mb-5 font-body text-[11px] font-bold uppercase tracking-[0.28em] text-cta">
						Studio / Operating System
					</p>

					<h1 className="font-heading text-[clamp(2.35rem,5.1vw,4.85rem)] font-semibold uppercase leading-[1.02] tracking-normal text-foreground">
						<span className="block">Run Your Brand.</span>
						<span className="block">Host Your Moment.</span>
						<span className="block text-cta">Own Your Space.</span>
					</h1>

					<p className="mt-6 max-w-lg font-body text-sm leading-7 text-muted-foreground sm:text-base">
						Labeld Studio gives independent brands and organizers one simple
						place to build storefronts, launch drops, sell tickets, manage
						orders, and stay in control.
					</p>

					<div className="mt-6 flex flex-wrap gap-2">
						{productChips.map((chip) => (
							<span
								key={chip}
								className="border border-border bg-surface px-3 py-2 font-body text-[11px] font-bold uppercase tracking-[0.18em] text-foreground"
							>
								{chip}
							</span>
						))}
					</div>

					<div className="mt-7 flex flex-col gap-3 sm:flex-row">
						<ButtonVite
							size="lg"
							className="h-12 bg-cta px-7 font-heading text-xs uppercase tracking-[0.16em] text-white hover:bg-cta/90"
							onClick={() => router.push("/login")}
						>
							Start Your Studio
							<ArrowRight className="h-4 w-4" />
						</ButtonVite>
						<ButtonVite
							size="lg"
							variant="outline"
							className="h-12 border-border bg-surface px-7 font-heading text-xs uppercase tracking-[0.16em] text-foreground hover:bg-bg"
							onClick={() =>
								window.open("https://apps.apple.com/app/id6760316742", "_blank")
							}
						>
							<Smartphone className="h-4 w-4" />
							Download Studio App
						</ButtonVite>
					</div>

					<div className="mt-7 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
						{proofPoints.map((point) => (
							<div key={point} className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
								<span>{point}</span>
							</div>
						))}
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 32 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.15 }}
					className="min-w-0"
				>
					<div className="relative border border-border bg-surface p-2 shadow-2xl shadow-black/10">
						<div className="flex items-center justify-between border-b border-border px-4 py-3">
							<div className="flex items-center gap-2">
								<span className="h-2.5 w-2.5 bg-cta" />
								<span className="h-2.5 w-2.5 bg-accent" />
								<span className="h-2.5 w-2.5 bg-muted" />
							</div>
							<span className="font-body text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
								Live dashboard
							</span>
						</div>
						<div className="relative aspect-[4/3] w-full overflow-hidden bg-bg sm:aspect-[16/10]">
							<Image
								src="/images/dashboard-mockup-light.jpeg"
								alt="Labeld Studio Dashboard Light"
								fill
								className="object-cover object-top dark:hidden"
								priority
							/>
							<Image
								src="/images/dashboard-mockup-dark.jpeg"
								alt="Labeld Studio Dashboard Dark"
								fill
								className="hidden object-cover object-top dark:block"
								priority
							/>
							<div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg to-transparent" />
						</div>
						<div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
							{["Orders", "Tickets", "Revenue"].map((metric) => (
								<div key={metric} className="bg-surface px-4 py-3">
									<p className="font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
										{metric}
									</p>
									<p className="mt-1 font-heading text-sm font-semibold text-foreground">
										Managed here
									</p>
								</div>
							))}
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default Hero;
