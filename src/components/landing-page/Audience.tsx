"use client";

import { motion } from "framer-motion";
import { Calendar, Flame, Shirt, Users } from "lucide-react";

const audiences = [
	{
		icon: Shirt,
		title: "Streetwear brands",
		description:
			"Launch collections, tell the brand story, sell out drops, and keep your storefront looking intentional.",
	},
	{
		icon: Flame,
		title: "Independent fashion",
		description:
			"Turn product photos, social heat, and repeat customers into a cleaner brand operation.",
	},
	{
		icon: Calendar,
		title: "Event organizers",
		description:
			"Build event pages, sell tickets, manage guests, and scan the room without duct-taping tools together.",
	},
	{
		icon: Users,
		title: "Creative communities",
		description:
			"Give your audience one home for drops, events, announcements, waitlists, and campaigns.",
	},
];

const Audience = () => {
	return (
		<section id="brands" className="border-b border-border bg-bg px-5 py-16 sm:px-6 md:py-24">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.7 }}
					className="mb-10 grid gap-4 md:grid-cols-[0.8fr_1.2fr] md:items-end"
				>
					<p className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-cta">
						Who it is for
					</p>
					<h2 className="max-w-3xl !font-sans text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-text sm:text-5xl">
						For the people building the room, not just posting from it.
					</h2>
				</motion.div>

				<div className="grid gap-px overflow-hidden rounded-[2rem] border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
					{audiences.map((item, index) => (
						<motion.div
							key={item.title}
							initial={{ opacity: 0, y: 24 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-60px" }}
							transition={{ duration: 0.6, delay: index * 0.05 }}
							className="group bg-surface p-6 transition-colors hover:bg-bg md:p-7"
						>
							<div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg text-cta">
								<item.icon className="h-5 w-5" strokeWidth={1.7} />
							</div>
							<h3 className="mt-10 !font-sans text-base font-medium leading-[1.08] tracking-[-0.035em] text-text">
								{item.title}
							</h3>
							<p className="mt-3 text-sm leading-6 text-text-muted">
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
