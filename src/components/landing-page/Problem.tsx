"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
	Instagram,
	MapPin,
	PackagePlus,
	RadioTower,
	ShoppingBag,
	Ticket,
} from "lucide-react";

const channels = [
	{
		icon: ShoppingBag,
		title: "Online storefront",
		description: "A premium brand space for drops, collections, and checkout.",
	},
	{
		icon: Instagram,
		title: "Social demand",
		description: "Turn attention from Instagram, TikTok, WhatsApp, and DMs into orders.",
	},
	{
		icon: Ticket,
		title: "Ticketed moments",
		description: "Sell experiences, manage guests, and scan people in at the door.",
	},
	{
		icon: MapPin,
		title: "Pop-ups and IRL",
		description: "Record manual sales and keep inventory and revenue in sync.",
	},
];

const productCards = [
	{ src: "/images/jorts.jpg", label: "Drop product" },
	{ src: "/images/flamingo.jpg", label: "Campaign image" },
	{ src: "/images/event-bg2.jpg", label: "Event visual" },
];

const Problem = () => {
	return (
		<section id="product" className="border-b border-border bg-surface px-5 py-16 sm:px-6 md:py-24">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 28 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.7 }}
					className="mb-10 grid gap-5 md:grid-cols-[0.95fr_1.05fr] md:items-end"
				>
					<div>
						<p className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-cta">
							Sell everywhere
						</p>
						<h2 className="max-w-3xl !font-sans text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-text sm:text-5xl">
							Your brand should move wherever the culture finds you.
						</h2>
					</div>
					<p className="max-w-xl font-body text-sm leading-7 text-text-muted md:justify-self-end md:text-base">
						Studio connects the messy parts of running a modern brand: online
						checkout, product drops, social demand, ticketed experiences,
						pop-ups, payments, and fulfillment.
					</p>
				</motion.div>

				<div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
					<motion.div
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.7 }}
						className="overflow-hidden rounded-[2rem] border border-border bg-bg p-4"
					>
						<div className="relative aspect-[16/10] overflow-hidden rounded-[1.45rem] bg-surface">
							<Image
								src="/images/brand-site-light.jpeg"
								alt="Labeld storefront experience"
								fill
								className="object-cover object-top dark:hidden"
								sizes="(max-width: 1024px) 100vw, 720px"
							/>
							<Image
								src="/images/brand-site-dark.jpeg"
								alt="Labeld storefront experience in dark mode"
								fill
								className="hidden object-cover object-top dark:block"
								sizes="(max-width: 1024px) 100vw, 720px"
							/>
						</div>
						<div className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
							{productCards.map((card) => (
								<div key={card.label} className="bg-surface p-2">
									<div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-bg">
										<Image
											src={card.src}
											alt={card.label}
											fill
											className="object-cover"
											sizes="220px"
										/>
									</div>
									<p className="px-2 pb-1 pt-3 text-xs font-semibold tracking-[-0.02em] text-text">
										{card.label}
									</p>
								</div>
							))}
						</div>
					</motion.div>

					<div className="grid gap-5">
						<div className="rounded-[2rem] border border-border bg-bg p-5 md:p-6">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-cta/10 text-cta">
									<RadioTower className="h-5 w-5" />
								</div>
								<div>
									<p className="text-sm font-semibold tracking-[-0.02em] text-text">
										One launch, many channels
									</p>
									<p className="text-xs text-text-muted">
										Publish once, manage the movement from Studio.
									</p>
								</div>
							</div>
							<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
								{channels.map((channel) => (
									<div key={channel.title} className="rounded-2xl border border-border bg-surface p-4">
										<channel.icon className="h-4 w-4 text-accent" strokeWidth={1.7} />
										<h3 className="mt-4 !font-sans text-sm font-medium leading-[1.08] tracking-[-0.035em] text-text">
											{channel.title}
										</h3>
										<p className="mt-2 text-xs leading-5 text-text-muted">
											{channel.description}
										</p>
									</div>
								))}
							</div>
						</div>

						<div className="rounded-[2rem] border border-border bg-foreground p-5 text-bg md:p-6">
							<PackagePlus className="h-5 w-5 text-accent" />
							<p className="mt-8 max-w-sm !font-sans text-2xl font-medium leading-[1.08] tracking-[-0.035em]">
								Drop product, sell ticket, fulfill order, read the room.
							</p>
							<p className="mt-4 text-sm leading-6 text-bg/70">
								That loop is the product. Labeld Studio keeps it tight.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Problem;
