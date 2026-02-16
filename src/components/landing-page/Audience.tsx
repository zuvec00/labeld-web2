"use client";

import { motion } from "framer-motion";
import { Palette, Calendar, Users } from "lucide-react";

const audiences = [
	{
		icon: Palette,
		title: "For Independent Brands",
		description:
			"Build your digital storefront, drop merch, and manage orders — all from one place that reflects your creative identity.",
	},
	{
		icon: Calendar,
		title: "For Event Organizers",
		description:
			"Host events, sell tickets, and create landing pages that match the energy of your experience. No generic templates.",
	},
	{
		icon: Users,
		title: "For Creative Communities",
		description:
			"Unite your audience, manage memberships, and create a branded space where culture thrives on your terms.",
	},
];

const cardVariants = {
	hidden: { opacity: 0, y: 40, scale: 0.97 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: 0.7,
			delay: i * 0.15,
			ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
		},
	}),
};

const Audience = () => {
	return (
		<section id="audience" className="py-32 px-6">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.7 }}
					className="mb-16 text-center"
				>
					<motion.p
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="mb-4 font-body text-sm font-medium uppercase tracking-[0.3em] text-accent"
					>
						Who It's For
					</motion.p>
					<h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
						Built for the Culture
					</h2>
				</motion.div>

				<div className="grid gap-6 md:grid-cols-3">
					{audiences.map((item, i) => (
						<motion.div
							key={item.title}
							custom={i}
							variants={cardVariants}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: "-60px" }}
							whileHover={{ y: -6, transition: { duration: 0.3 } }}
							className="group rounded-lg border border-border bg-surface p-8 transition-colors hover:border-cta/30"
						>
							<motion.div
								initial={{ scale: 0.8, opacity: 0 }}
								whileInView={{ scale: 1, opacity: 1 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
								className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-cta/10"
							>
								<item.icon className="h-6 w-6 text-cta" />
							</motion.div>
							<h3 className="mb-3 font-heading text-lg font-semibold text-foreground">
								{item.title}
							</h3>
							<p className="font-body text-sm leading-relaxed text-muted-foreground">
								{item.description}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};

export default Audience;
