"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const previews = [
	{
		lightSrc: "/images/dashboard-mockup-light.jpeg",
		darkSrc: "/images/dashboard-mockup-dark.jpeg",
		alt: "Labeld Studio Dashboard",
		label: "Operating hub",
		title: "Manage orders, products, tickets, and analytics from one place.",
	},
	{
		lightSrc: "/images/event-site-dark.jpeg",
		darkSrc: "/images/event-site-dark.jpeg",
		alt: "Event Page Preview",
		label: "Event pages",
		title: "Sell tickets and present the experience without leaving Studio.",
	},
	{
		lightSrc: "/images/brand-site-light.jpeg",
		darkSrc: "/images/brand-site-dark.jpeg",
		alt: "Brand Site Preview",
		label: "Brand sites",
		title: "Give every brand a storefront that feels intentional from day one.",
	},
];

const VisualProof = () => {
	return (
		<section className="border-b border-border bg-surface px-6 py-20 md:py-28">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
					className="mb-12 grid gap-4 md:grid-cols-[0.75fr_1.25fr] md:items-end"
				>
					<div>
						<p className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.28em] text-cta">
							Product proof
						</p>
						<h2 className="font-heading text-2xl font-semibold uppercase leading-[1.08] text-foreground sm:text-4xl">
							The actual surfaces behind the system.
						</h2>
					</div>
					<p className="font-body text-sm leading-relaxed text-muted-foreground md:text-base">
						Studio should be easy to understand before anyone signs up. Show the
						control panel, the storefront, and the event layer in plain sight.
					</p>
				</motion.div>

				<div className="grid gap-5 lg:grid-cols-3">
					{previews.map((preview, i) => (
						<motion.div
							key={preview.label}
							initial={{ opacity: 0, y: 50 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-40px" }}
							transition={{
								duration: 0.7,
								delay: i * 0.15,
								ease: [0.25, 0.1, 0.25, 1],
							}}
							className={i === 0 ? "lg:col-span-2" : ""}
						>
							<div className="overflow-hidden border border-border bg-bg">
								<div className="flex items-center justify-between border-b border-border px-4 py-3">
									<span className="font-body text-[10px] font-bold uppercase tracking-[0.22em] text-cta">
										{preview.label}
									</span>
									<span className="h-2 w-2 bg-accent" />
								</div>
								<div
									className={`relative w-full bg-surface ${
										i === 0 ? "aspect-[16/10]" : "aspect-[4/5] lg:aspect-[16/13]"
									}`}
								>
									<Image
										src={preview.lightSrc}
										alt={`${preview.alt} Light`}
										fill
										className="object-cover object-top dark:hidden"
										loading="lazy"
									/>
									<Image
										src={preview.darkSrc}
										alt={`${preview.alt} Dark`}
										fill
										className="hidden object-cover object-top dark:block"
										loading="lazy"
									/>
								</div>
								<div className="border-t border-border bg-surface px-5 py-5">
									<h3 className="font-heading text-sm font-semibold uppercase leading-tight text-foreground">
										{preview.title}
									</h3>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};

export default VisualProof;
