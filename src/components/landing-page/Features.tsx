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
		title: "Custom Brand Sites",
		description:
			"Build a storefront that looks and feels like your brand. No cookie-cutter templates.",
	},
	{
		icon: ShoppingBag,
		title: "Product Drops & Merch",
		description:
			"Launch limited drops, manage inventory, and sell directly to your audience.",
	},
	{
		icon: Ticket,
		title: "Event Hosting & Ticketing",
		description:
			"Create event pages, sell tickets, and manage check-ins — all in one place.",
	},
	{
		icon: LayoutDashboard,
		title: "Unified Dashboard",
		description:
			"Products, events, orders, and analytics. Everything you need, one view.",
	},
	{
		icon: BarChart3,
		title: "Analytics & Orders",
		description:
			"Track performance, understand your audience, and make smarter decisions.",
	},
	{
		icon: CreditCard,
		title: "Integrated Payments",
		description:
			"Accept payments seamlessly. No third-party redirects, no friction.",
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
		<section id="features" className="py-32 px-6">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.7 }}
					className="mb-16 text-center"
				>
					<p className="mb-4 font-body text-sm font-medium uppercase tracking-[0.3em] text-accent">
						Features
					</p>
					<h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
						Everything You Need. Nothing You Don't.
					</h2>
				</motion.div>

				<motion.div
					variants={containerVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-60px" }}
					className="grid gap-px rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-3"
				>
					{features.map((feature) => (
						<motion.div
							key={feature.title}
							variants={itemVariants}
							whileHover={{
								backgroundColor: "hsl(var(--surface))",
								transition: { duration: 0.3 },
							}}
							className="bg-bg p-8 cursor-default"
						>
							<motion.div
								whileHover={{ scale: 1.15, rotate: -5 }}
								transition={{ type: "spring", stiffness: 300 }}
							>
								<feature.icon
									className="mb-5 h-5 w-5 text-cta"
									strokeWidth={1.5}
								/>
							</motion.div>
							<h3 className="mb-2 font-heading text-sm font-semibold text-foreground">
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
