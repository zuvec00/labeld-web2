"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const intelligence = [
	"Draft storefront-ready copy",
	"Find product and drop opportunities",
	"Spot order and inventory issues",
	"Keep brand, audience, and sales signals together",
];

const operationRows = [
	["Orders", "Paid, unfulfilled, shipped, delivered"],
	["Products", "Drops, stock, collections, sold-out states"],
	["Analytics", "Revenue, conversion, channels, audience"],
	["Events", "Tickets, guest lists, check-ins, event sales"],
];

const Features = () => {
	return (
		<section id="features" className="border-b border-border bg-bg px-5 py-16 sm:px-6 md:py-24">
			<div className="mx-auto max-w-7xl space-y-16">
				<div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
					<motion.div
						initial={{ opacity: 0, y: 28 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-80px" }}
						transition={{ duration: 0.7 }}
						className="rounded-[2rem] border border-border bg-surface p-6 md:p-8"
					>
						<p className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
							Labeld Intelligence
						</p>
						<h2 className="mt-5 max-w-xl !font-sans text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-text sm:text-5xl">
							A sharper assistant for brands that cannot afford generic.
						</h2>
						<p className="mt-5 max-w-xl text-sm leading-7 text-text-muted md:text-base">
							Studio should not only store data. It should help founders notice
							what is moving, what needs attention, and what to do next.
						</p>
						<div className="mt-10 space-y-px overflow-hidden rounded-2xl border border-border bg-border">
							{intelligence.map((item, index) => (
								<div
									key={item}
									className="grid grid-cols-[auto_1fr] items-center gap-4 bg-bg px-4 py-4"
								>
									<span className="font-body text-[10px] font-bold text-cta">
										{String(index + 1).padStart(2, "0")}
									</span>
									<span className="text-sm tracking-[-0.02em] text-text">
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
						<div className="relative min-h-[580px] overflow-hidden rounded-[1.55rem] bg-bg">
							<Image
								src="/images/dashboard-mockup-light.jpeg"
								alt="Labeld Studio dashboard control room"
								fill
								className="object-cover object-top dark:hidden"
								sizes="(max-width: 1024px) 100vw, 760px"
							/>
							<Image
								src="/images/dashboard-mockup-dark.jpeg"
								alt="Labeld Studio dashboard control room in dark mode"
								fill
								className="hidden object-cover object-top dark:block"
								sizes="(max-width: 1024px) 100vw, 760px"
							/>
							<div className="absolute inset-x-4 bottom-4 rounded-2xl border border-border bg-surface/95 p-5 backdrop-blur md:inset-x-6 md:bottom-6">
								<p className="!font-sans text-2xl font-medium leading-[1.08] tracking-[-0.035em] text-text">
									3 opportunities found
								</p>
								<p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">
									Draft product copy, spot sold-out pressure, clean up a weak
									drop page, and move faster without making the brand feel
									templated.
								</p>
							</div>
						</div>
					</motion.div>
				</div>

				<div id="events" className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
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

					<div className="overflow-hidden rounded-[2rem] border border-border bg-surface">
						<div className="relative min-h-[360px] border-b border-border bg-bg">
							<Image
								src="/images/mobile-app/manage-orders.png"
								alt="Labeld Studio order management on mobile"
								fill
								className="object-cover object-top opacity-90"
								sizes="(max-width: 1024px) 100vw, 760px"
							/>
							<div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/60 to-transparent" />
							<div className="absolute bottom-6 left-6 max-w-sm">
								<p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
									Web + mobile
								</p>
								<p className="mt-3 !font-sans text-2xl font-medium leading-[1.08] tracking-[-0.035em] text-text">
									Start on desktop. Keep moving from the phone.
								</p>
							</div>
						</div>
						<div className="divide-y divide-border">
							{operationRows.map(([title, detail]) => (
								<div
									key={title}
									className="grid gap-2 px-5 py-4 sm:grid-cols-[0.35fr_0.65fr] sm:items-center"
								>
									<p className="!font-sans text-base font-medium leading-[1.08] tracking-[-0.035em] text-text">
										{title}
									</p>
									<p className="text-sm leading-6 text-text-muted">{detail}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Features;
