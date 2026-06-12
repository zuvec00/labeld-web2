"use client";

import { motion } from "framer-motion";
import { Palette, Calendar, Users } from "lucide-react";

const audiences = [
	{
		icon: Palette,
		title: "For Independent Brands",
		description:
			"Build a storefront, publish drops, manage orders, and keep your brand world intact.",
	},
	{
		icon: Calendar,
		title: "For Event Organizers",
		description:
			"Create event pages, sell tickets, manage guest lists, and check people in from one place.",
	},
	{
		icon: Users,
		title: "For Creative Communities",
		description:
			"Give your audience a branded home for drops, announcements, experiences, and repeat engagement.",
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
		<section id="audience" className="border-b border-border bg-surface px-6 py-20 md:py-24">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.7 }}
					className="mb-10 grid gap-4 md:grid-cols-[0.8fr_1.2fr] md:items-end"
				>
					<motion.p
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="font-body text-[11px] font-bold uppercase tracking-[0.28em] text-accent"
					>
						Who It's For
					</motion.p>
					<h2 className="font-heading text-2xl font-semibold uppercase leading-[1.08] text-foreground sm:text-4xl">
						Built for the people running the culture.
					</h2>
				</motion.div>

				<div className="grid gap-px border border-border bg-border md:grid-cols-3">
					{audiences.map((item, i) => (
						<motion.div
							key={item.title}
							custom={i}
							variants={cardVariants}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true, margin: "-60px" }}
							className="group bg-bg p-6 transition-colors hover:bg-surface md:p-8"
						>
							<motion.div
								initial={{ scale: 0.8, opacity: 0 }}
								whileInView={{ scale: 1, opacity: 1 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
								className="mb-8 flex h-10 w-10 items-center justify-center border border-border bg-surface"
							>
								<item.icon className="h-6 w-6 text-cta" />
							</motion.div>
							<h3 className="mb-3 font-heading text-base font-semibold uppercase leading-tight text-foreground">
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
