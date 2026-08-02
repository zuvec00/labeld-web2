"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const audiences = [
	{
		image: "/images/jorts.jpg",
		title: "Streetwear brands",
		description:
			"Launch collections, tell the brand story, sell out drops, and keep your storefront intentional.",
	},
	{
		image: "/images/onboarding-hero.JPEG",
		title: "Independent fashion",
		description:
			"Turn product photos, social heat, and repeat customers into a cleaner brand operation.",
	},
	{
		image: "/images/rave.jpg",
		title: "Event organizers",
		description:
			"Build event pages, sell tickets, manage guests, and scan the room without duct-taping tools together.",
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
					className="mb-12 max-w-4xl"
				>
					<p className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-cta">
						Who it is for
					</p>
					<h2 className="!font-sans text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-text sm:text-5xl">
						For the people building the room, not just posting from it.
					</h2>
				</motion.div>

				<div className="grid gap-5 lg:grid-cols-3">
					{audiences.map((item, index) => (
						<motion.article
							key={item.title}
							initial={{ opacity: 0, y: 24 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-60px" }}
							transition={{ duration: 0.6, delay: index * 0.06 }}
							className="group overflow-hidden rounded-[2rem] border border-border bg-surface"
						>
							<div className="relative aspect-[1.42/1] overflow-hidden bg-bg">
								<Image
									src={item.image}
									alt={item.title}
									fill
									className="object-cover transition duration-700 group-hover:scale-[1.03]"
									sizes="(max-width: 1024px) 100vw, 420px"
								/>
							</div>
							<div className="p-5 md:p-6">
								<h3 className="!font-sans text-xl font-medium leading-[1.08] tracking-[-0.035em] text-text">
									{item.title}
								</h3>
								<p className="mt-3 text-sm leading-6 text-text-muted">
									{item.description}
								</p>
							</div>
						</motion.article>
					))}
				</div>
			</div>
		</section>
	);
};

export default Audience;
