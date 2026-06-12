"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const scattered = [
	"One link for products",
	"Another tool for tickets",
	"DMs for orders and questions",
	"Templates that flatten your identity",
];

const unified = [
	"Storefronts, drops, and tickets together",
	"Orders and check-ins in one dashboard",
	"Branded pages that still feel like you",
	"Analytics that show what is actually moving",
];

const Problem = () => {
	return (
		<section className="border-b border-border px-6 py-20 md:py-28">
			<div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
				>
					<p className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.28em] text-cta">
						The problem
					</p>
					<h2 className="font-heading text-3xl font-semibold uppercase leading-[1.06] text-foreground sm:text-5xl">
						<span className="block">Too Many Tools.</span>
						<span className="block text-muted-foreground">No Control.</span>
					</h2>
					<p className="mt-6 max-w-md font-body text-base leading-relaxed text-muted-foreground">
						Fragmented platforms. Generic templates that strip your brand.
						Disconnected ticketing, payments, and storefronts that don't talk to
						each other.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7, delay: 0.1 }}
					className="grid gap-px border border-border bg-border md:grid-cols-2"
				>
					<div className="bg-bg p-6 md:p-8">
						<p className="mb-5 font-heading text-sm font-semibold uppercase text-muted-foreground">
							Scattered now
						</p>
						<ul className="space-y-4">
							{scattered.map((item) => (
								<li key={item} className="flex gap-3 font-body text-sm text-muted-foreground">
									<X className="mt-0.5 h-4 w-4 shrink-0 text-cta" />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>
					<div className="bg-surface p-6 md:p-8">
						<p className="mb-5 font-heading text-sm font-semibold uppercase text-foreground">
							Studio brings it together
						</p>
						<ul className="space-y-4">
							{unified.map((item) => (
								<li key={item} className="flex gap-3 font-body text-sm text-foreground">
									<Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>
				</motion.div>
			</div>
		</section>
	);
};

export default Problem;
