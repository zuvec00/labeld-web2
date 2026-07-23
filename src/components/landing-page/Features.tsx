"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
	BadgeCheck,
	BarChart3,
	Bot,
	Boxes,
	ClipboardList,
	Lightbulb,
	Mail,
	ShieldCheck,
} from "lucide-react";

const intelligence = [
	"Draft storefront-ready copy",
	"Find product and drop opportunities",
	"Spot order and inventory issues",
	"Keep brand, audience, and sales signals together",
];

const controlRoom = [
	{ icon: ClipboardList, title: "Orders", detail: "Paid, unfulfilled, shipped, delivered." },
	{ icon: Boxes, title: "Products", detail: "Drops, stock, collections, sold-out states." },
	{ icon: BarChart3, title: "Analytics", detail: "Revenue, conversion, channels, audience." },
	{ icon: ShieldCheck, title: "Domains", detail: "Protected storefronts and custom domains." },
	{ icon: Mail, title: "Campaigns", detail: "Newsletters, waitlists, and repeat demand." },
	{ icon: BadgeCheck, title: "Events", detail: "Tickets, guests, check-ins, event sales." },
];

const Features = () => {
	return (
		<section id="features" className="border-b border-border bg-bg px-5 py-16 sm:px-6 md:py-24">
			<div className="mx-auto max-w-7xl space-y-16">
				<div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
					<motion.div
						initial={{ opacity: 0, y: 28 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-80px" }}
						transition={{ duration: 0.7 }}
						className="rounded-[2rem] border border-border bg-surface p-6 md:p-8"
					>
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
							<Bot className="h-6 w-6" />
						</div>
						<p className="mt-10 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
							Labeld Intelligence
						</p>
						<h2 className="mt-4 max-w-xl !font-sans text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-text sm:text-5xl">
							A sharper assistant for brands that cannot afford generic.
						</h2>
						<p className="mt-5 max-w-xl text-sm leading-7 text-text-muted md:text-base">
							Studio should not only store data. It should help founders notice
							what is moving, what needs attention, and what to do next.
						</p>
						<div className="mt-8 grid gap-3">
							{intelligence.map((item) => (
								<div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-bg px-4 py-3">
									<Lightbulb className="h-4 w-4 text-cta" />
									<span className="text-sm font-medium tracking-[-0.02em] text-text">
										{item}
									</span>
								</div>
							))}
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 28 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-80px" }}
						transition={{ duration: 0.7, delay: 0.08 }}
						className="overflow-hidden rounded-[2rem] border border-border bg-surface p-3"
					>
						<div className="relative aspect-[16/12] min-h-[440px] overflow-hidden rounded-[1.45rem] bg-bg">
							<Image
								src="/images/dashboard-mockup-light.jpeg"
								alt="Labeld Studio dashboard control room"
								fill
								className="object-cover object-top dark:hidden"
								sizes="(max-width: 1024px) 100vw, 680px"
							/>
							<Image
								src="/images/dashboard-mockup-dark.jpeg"
								alt="Labeld Studio dashboard control room in dark mode"
								fill
								className="hidden object-cover object-top dark:block"
								sizes="(max-width: 1024px) 100vw, 680px"
							/>
							<div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-border bg-surface/95 p-4 backdrop-blur">
								<p className="text-sm font-semibold tracking-[-0.02em] text-text">
									3 opportunities found
								</p>
								<p className="mt-1 text-xs leading-5 text-text-muted">
									Labeld can draft product copy, surface sold-out pressure, and
									point you to the next move.
								</p>
							</div>
						</div>
					</motion.div>
				</div>

				<div id="events" className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
					<div>
						<p className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-cta">
							Control room
						</p>
						<h2 className="max-w-xl !font-sans text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-text sm:text-5xl">
							Everything behind the drop lives in one clean dashboard.
						</h2>
						<p className="mt-5 max-w-lg text-sm leading-7 text-text-muted md:text-base">
							Shopify-level clarity, translated for the way Labeld brands move:
							visual products, ticketed moments, social channels, and mobile
							operations.
						</p>
					</div>
					<div className="grid gap-px overflow-hidden rounded-[2rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
						{controlRoom.map((item) => (
							<div key={item.title} className="bg-surface p-5 md:p-6">
								<item.icon className="h-5 w-5 text-cta" strokeWidth={1.7} />
								<h3 className="mt-8 !font-sans text-sm font-medium leading-[1.08] tracking-[-0.035em] text-text">
									{item.title}
								</h3>
								<p className="mt-2 text-xs leading-5 text-text-muted">{item.detail}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

export default Features;
