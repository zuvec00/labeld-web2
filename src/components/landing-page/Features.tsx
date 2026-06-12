"use client";

import { motion } from "framer-motion";
import {
	Globe,
	ShoppingBag,
	Ticket,
	LayoutDashboard,
	BarChart3,
	CreditCard,
} from "lucide-react";

const features = [
	{
		icon: Globe,
		group: "Build",
		title: "Custom Brand Sites",
		description:
			"Launch a storefront, choose a template, and make the page feel like your brand.",
	},
	{
		icon: ShoppingBag,
		group: "Sell",
		title: "Product Drops & Merch",
		description:
			"Publish drops, track inventory, take payments, and manage order flow.",
	},
	{
		icon: Ticket,
		group: "Experience",
		title: "Event Hosting & Ticketing",
		description:
			"Create event pages, sell tickets, manage guest lists, and run check-ins.",
	},
	{
		icon: LayoutDashboard,
		group: "Operate",
		title: "Unified Dashboard",
		description:
			"Products, events, orders, and setup tasks in one control surface.",
	},
	{
		icon: BarChart3,
		group: "Understand",
		title: "Analytics & Orders",
		description:
			"See what is selling, what is moving, and where attention is coming from.",
	},
	{
		icon: CreditCard,
		group: "Collect",
		title: "Integrated Payments",
		description:
			"Accept payments and keep storefront, tickets, and orders connected.",
	},
];

const containerVariants = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.08 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20, scale: 0.98 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: 0.6,
			ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
		},
	},
};

const Features = () => {
	return (
		<section id="features" className="border-b border-border bg-bg px-6 py-20 md:py-28">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.7 }}
					className="mb-12 grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:items-end"
				>
					<div>
						<p className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.28em] text-accent">
							Operating system
						</p>
						<h2 className="font-heading text-2xl font-semibold uppercase leading-[1.08] text-foreground sm:text-4xl">
							Everything you need. Nothing that gets in the way.
						</h2>
					</div>
					<p className="font-body text-sm leading-relaxed text-muted-foreground md:text-base">
						Studio connects the practical work behind a cultural brand:
						pages, products, tickets, payments, orders, and performance.
					</p>
				</motion.div>

				<motion.div
					variants={containerVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-60px" }}
					className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3"
				>
					{features.map((feature) => (
						<motion.div
							key={feature.title}
							variants={itemVariants}
							className="bg-surface p-6 md:p-8"
						>
							<div className="mb-8 flex items-center justify-between">
								<feature.icon className="h-5 w-5 text-cta" strokeWidth={1.5} />
								<span className="font-body text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
									{feature.group}
								</span>
							</div>
							<h3 className="mb-2 font-heading text-sm font-semibold uppercase text-foreground">
								{feature.title}
							</h3>
							<p className="font-body text-sm leading-relaxed text-muted-foreground">
								{feature.description}
							</p>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
};

export default Features;
