"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Smartphone } from "lucide-react";
import { ButtonVite } from "@/components/ui/buttonVite";

const mobileScreens = [
	{
		src: "/images/mobile-app/build-your-brand.png",
		label: "Build your brand on Labeld",
	},
	{
		src: "/images/mobile-app/choose-template.png",
		label: "Choose your brand template",
	},
	{
		src: "/images/mobile-app/launch-drop.png",
		label: "Launch your next drop",
	},
	{
		src: "/images/mobile-app/manage-orders.png",
		label: "Orders, all in one place",
	},
	{
		src: "/images/mobile-app/track-growth.png",
		label: "Track your growth",
	},
	{
		src: "/images/mobile-app/brands-and-events.png",
		label: "Built for brands & events",
	},
	{
		src: "/images/mobile-app/run-events.png",
		label: "Run your events with ease",
	},
	{
		src: "/images/mobile-app/track-ticket-sales.png",
		label: "Track every ticket sale",
	},
	{
		src: "/images/mobile-app/scan-tickets.png",
		label: "Scan tickets instantly",
	},
];

const VisualProof = () => {
	return (
		<section className="overflow-hidden border-b border-border bg-surface px-5 py-16 sm:px-6 md:py-24">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 28 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
					className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end"
				>
					<div>
						<p className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.28em] text-cta">
							Product proof
						</p>
						<h2 className="max-w-3xl font-heading text-2xl font-semibold uppercase leading-[1.08] text-foreground sm:text-4xl">
							Best run on mobile. Backed by a serious web dashboard.
						</h2>
					</div>
					<div className="max-w-xl md:justify-self-end">
						<p className="font-body text-sm leading-7 text-muted-foreground md:text-base">
							Studio web gives founders the control room. The mobile app keeps the
							actual day-to-day close: drops, orders, events, storefront edits, and
							audience signals in your hand.
						</p>
						<ButtonVite
							size="lg"
							className="mt-6 h-11 bg-foreground px-6 font-heading text-xs uppercase tracking-[0.16em] text-bg hover:bg-foreground/90"
							onClick={() =>
								window.open("https://apps.apple.com/app/id6760316742", "_blank")
							}
						>
							<Smartphone className="h-4 w-4" />
							Download Studio App
						</ButtonVite>
					</div>
				</motion.div>

				<div className="mt-12 -mx-5 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
					<div className="flex w-max gap-4 md:gap-5">
						{mobileScreens.map((screen, index) => (
							<motion.figure
								key={screen.src}
								initial={{ opacity: 0, y: 40 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-40px" }}
								transition={{ duration: 0.6, delay: index * 0.06 }}
								className="w-[210px] shrink-0 overflow-hidden border border-border bg-bg shadow-sm sm:w-[240px] lg:w-[260px]"
							>
								<div className="relative aspect-[9/16] bg-muted">
									<Image
										src={screen.src}
										alt={`${screen.label} mobile screen`}
										fill
										className="object-cover object-top"
										sizes="(max-width: 640px) 210px, (max-width: 1024px) 240px, 260px"
									/>
								</div>
								<figcaption className="border-t border-border bg-bg px-4 py-4">
									<p className="font-heading text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
										{screen.label}
									</p>
								</figcaption>
							</motion.figure>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

export default VisualProof;
