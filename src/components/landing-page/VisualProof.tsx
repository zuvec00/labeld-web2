"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Smartphone } from "lucide-react";
import { ButtonVite } from "@/components/ui/buttonVite";

const appStoreUrl = "https://apps.apple.com/app/id6760316742";

const mobileScreens = [
	{
		src: "/images/mobile-app/build-your-brand.png",
		label: "Brand intelligence",
	},
	{
		src: "/images/mobile-app/launch-drop.png",
		label: "Launch drops",
	},
	{
		src: "/images/mobile-app/manage-orders.png",
		label: "Manage orders",
	},
	{
		src: "/images/mobile-app/run-events.png",
		label: "Run events",
	},
	{
		src: "/images/mobile-app/scan-tickets.png",
		label: "Scan tickets",
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
					className="grid gap-6 md:grid-cols-[0.95fr_1.05fr] md:items-end"
				>
					<div>
						<p className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
							Mobile extension
						</p>
						<h2 className="max-w-3xl !font-sans text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-text sm:text-5xl">
							Web gives you the control room. Mobile keeps the motion close.
						</h2>
					</div>
					<div className="max-w-xl md:justify-self-end">
						<p className="font-body text-sm leading-7 text-text-muted md:text-base">
							The same Studio logic continues on phone: confirm orders, launch
							products, check sales, manage events, and move through the day
							without losing the brand world.
						</p>
						<ButtonVite
							size="lg"
							className="mt-6 h-11 rounded-full bg-foreground px-6 font-body text-sm font-bold tracking-[-0.01em] text-bg hover:bg-foreground/90"
							onClick={() => window.open(appStoreUrl, "_blank")}
						>
							<Smartphone className="h-4 w-4" />
							Download Studio app
							<ArrowRight className="h-4 w-4" />
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
								className="w-[210px] shrink-0 overflow-hidden rounded-[1.7rem] border border-border bg-bg p-2 shadow-sm sm:w-[240px] lg:w-[260px]"
							>
								<div className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-muted">
									<Image
										src={screen.src}
										alt={`${screen.label} mobile screen`}
										fill
										className="object-cover object-top"
										sizes="(max-width: 640px) 210px, (max-width: 1024px) 240px, 260px"
									/>
								</div>
								<figcaption className="px-3 py-4">
									<p className="font-body text-sm font-semibold tracking-[-0.02em] text-text">
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
