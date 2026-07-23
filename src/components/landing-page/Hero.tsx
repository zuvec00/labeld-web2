"use client";

import { ButtonVite } from "@/components/ui/buttonVite";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
	ArrowRight,
	BarChart3,
	CreditCard,
	Globe2,
	PackageCheck,
	ShoppingBag,
	Smartphone,
	Ticket,
} from "lucide-react";

const appStoreUrl = "https://apps.apple.com/app/id6760316742";

const proofItems = [
	{ icon: Globe2, label: "Storefronts" },
	{ icon: ShoppingBag, label: "Drops" },
	{ icon: Ticket, label: "Tickets" },
	{ icon: PackageCheck, label: "Orders" },
	{ icon: BarChart3, label: "Analytics" },
	{ icon: CreditCard, label: "Payouts" },
];

const stats = [
	{ value: "01", label: "Brand space" },
	{ value: "24/7", label: "Mobile + web" },
	{ value: "0%", label: "Labeld fee on Pro storefronts" },
];

const Hero = () => {
	const router = useRouter();

	return (
		<section className="relative overflow-hidden border-b border-border bg-bg px-5 pb-10 pt-24 sm:px-6 md:pb-14 md:pt-28">
			<div className="relative z-10 mx-auto max-w-7xl">
				<div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
					<motion.div
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7 }}
						className="max-w-3xl"
					>
						<p className="mb-5 w-fit rounded-full border border-border bg-surface px-3.5 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.18em] text-cta">
							Culture OS / Studio web
						</p>
						<h1 className="max-w-4xl !font-sans text-[clamp(3rem,7vw,6.6rem)] font-medium leading-[1.08] tracking-[-0.035em] text-text">
							The culture OS for brands, drops, and events.
						</h1>
						<p className="mt-6 max-w-2xl font-body text-base leading-8 text-text-muted md:text-lg">
							Build a premium storefront, launch the next drop, sell tickets,
							manage orders, and keep the whole operation moving from one
							connected Studio.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<ButtonVite
								size="lg"
								className="h-12 rounded-full bg-foreground px-7 font-body text-sm font-bold tracking-[-0.01em] text-bg hover:bg-foreground/90"
								onClick={() => router.push("/login")}
							>
								Start Studio
								<ArrowRight className="h-4 w-4" />
							</ButtonVite>
							<ButtonVite
								size="lg"
								variant="outline"
								className="h-12 rounded-full border-border bg-surface px-7 font-body text-sm font-bold tracking-[-0.01em] text-text hover:bg-bg"
								onClick={() => window.open(appStoreUrl, "_blank")}
							>
								<Smartphone className="h-4 w-4" />
								Download app
							</ButtonVite>
						</div>
						<div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
							{stats.map((stat) => (
								<div key={stat.label} className="bg-surface px-5 py-4">
									<p className="font-body text-2xl font-semibold tracking-[-0.045em] text-text">
										{stat.value}
									</p>
									<p className="mt-1 text-xs leading-5 text-text-muted">
										{stat.label}
									</p>
								</div>
							))}
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 32 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.12 }}
						className="relative min-h-[520px] lg:min-h-[640px]"
					>
						<div className="absolute inset-x-0 top-4 overflow-hidden rounded-[2rem] border border-border bg-surface p-2 shadow-2xl shadow-black/10">
							<div className="relative aspect-[16/11] overflow-hidden rounded-[1.5rem] bg-bg">
								<Image
									src="/images/dashboard-mockup-light.jpeg"
									alt="Labeld Studio web dashboard"
									fill
									priority
									className="object-cover object-top dark:hidden"
									sizes="(max-width: 1024px) 100vw, 640px"
								/>
								<Image
									src="/images/dashboard-mockup-dark.jpeg"
									alt="Labeld Studio web dashboard in dark mode"
									fill
									priority
									className="hidden object-cover object-top dark:block"
									sizes="(max-width: 1024px) 100vw, 640px"
								/>
							</div>
						</div>

						<div className="absolute bottom-6 left-0 w-[44%] overflow-hidden rounded-[1.6rem] border border-border bg-surface p-2 shadow-xl shadow-black/10">
							<div className="relative aspect-[9/16] overflow-hidden rounded-[1.15rem] bg-bg">
								<Image
									src="/images/mobile-app/build-your-brand.png"
									alt="Labeld Studio mobile brand overview"
									fill
									className="object-cover object-top"
									sizes="260px"
								/>
							</div>
						</div>

						<div className="absolute bottom-0 right-0 w-[58%] overflow-hidden rounded-[1.6rem] border border-border bg-surface p-3 shadow-xl shadow-black/10">
							<div className="relative aspect-[4/3] overflow-hidden rounded-[1.1rem] bg-bg">
								<Image
									src="/images/brand-site-light.jpeg"
									alt="A Labeld storefront preview"
									fill
									className="object-cover object-top dark:hidden"
									sizes="360px"
								/>
								<Image
									src="/images/brand-site-dark.jpeg"
									alt="A Labeld storefront preview in dark mode"
									fill
									className="hidden object-cover object-top dark:block"
									sizes="360px"
								/>
							</div>
							<div className="mt-3 flex items-center justify-between gap-3">
								<div>
									<p className="font-body text-sm font-semibold tracking-[-0.02em] text-text">
										Drop is live
									</p>
									<p className="text-xs text-text-muted">
										Storefront, orders, and analytics connected
									</p>
								</div>
								<span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
									Live
								</span>
							</div>
						</div>
					</motion.div>
				</div>

				<div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-6">
					{proofItems.map((item) => (
						<div
							key={item.label}
							className="flex items-center gap-3 bg-surface px-4 py-4"
						>
							<item.icon className="h-4 w-4 text-cta" strokeWidth={1.7} />
							<span className="font-body text-sm font-semibold tracking-[-0.02em] text-text">
								{item.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default Hero;
