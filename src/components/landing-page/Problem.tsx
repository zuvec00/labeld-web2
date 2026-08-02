"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const productMoments = [
	{
		src: "/images/jorts.jpg",
		title: "Drop",
		description: "Product pages that let the clothes carry the feeling.",
	},
	{
		src: "/images/event-bg2.jpg",
		title: "Event",
		description: "Ticketed moments connected to orders, guests, and check-in.",
	},
	{
		src: "/images/flamingo.jpg",
		title: "Campaign",
		description: "A place to turn social heat into something ownable.",
	},
];

const channelNotes = [
	"Online storefront",
	"Instagram, TikTok, WhatsApp",
	"Pop-ups and in-person sales",
	"Events and ticketing",
];

const Problem = () => {
	return (
		<section id="product" className="border-b border-border bg-surface px-5 py-16 sm:px-6 md:py-24">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 28 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.7 }}
					className="mb-12 grid gap-5 md:grid-cols-[1.05fr_0.95fr] md:items-end"
				>
					<div>
						<p className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-cta">
							Sell everywhere
						</p>
						<h2 className="max-w-4xl !font-sans text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-text sm:text-5xl">
							Your brand should move wherever the culture finds you.
						</h2>
					</div>
					<p className="max-w-xl font-body text-sm leading-7 text-text-muted md:justify-self-end md:text-base">
						Not a pile of feature boxes. One connected surface for the way
						independent fashion sells now: storefront, socials, drops, events,
						pop-ups, payment, and fulfillment.
					</p>
				</motion.div>

				<div className="overflow-hidden rounded-[2rem] border border-border bg-bg p-3 md:p-4">
					<div className="grid gap-3 lg:grid-cols-[1.18fr_0.82fr]">
						<motion.div
							initial={{ opacity: 0, y: 24 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.7 }}
							className="relative min-h-[520px] overflow-hidden rounded-[1.6rem] bg-surface"
						>
							<Image
								src="/images/brand-site-light.jpeg"
								alt="Labeld storefront experience"
								fill
								className="object-cover object-top dark:hidden"
								sizes="(max-width: 1024px) 100vw, 760px"
							/>
							<Image
								src="/images/brand-site-dark.jpeg"
								alt="Labeld storefront experience in dark mode"
								fill
								className="hidden object-cover object-top dark:block"
								sizes="(max-width: 1024px) 100vw, 760px"
							/>
							<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/80 to-transparent p-5 pt-24 md:p-7 md:pt-28">
								<div className="max-w-md rounded-2xl border border-border bg-surface/95 p-4 backdrop-blur">
									<p className="!font-sans text-lg font-medium leading-[1.08] tracking-[-0.035em] text-text">
										Launch once. Sell across the whole room.
									</p>
									<div className="mt-4 flex flex-wrap gap-2">
										{channelNotes.map((note) => (
											<span
												key={note}
												className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-text-muted"
											>
												{note}
											</span>
										))}
									</div>
								</div>
							</div>
						</motion.div>

						<div className="grid gap-3">
							{productMoments.map((moment, index) => (
								<motion.article
									key={moment.title}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true, margin: "-60px" }}
									transition={{ duration: 0.6, delay: index * 0.06 }}
									className="grid min-h-[164px] overflow-hidden rounded-[1.6rem] border border-border bg-surface sm:grid-cols-[0.9fr_1.1fr] lg:grid-cols-1 xl:grid-cols-[0.9fr_1.1fr]"
								>
									<div className="relative min-h-[160px] bg-bg">
										<Image
											src={moment.src}
											alt={moment.title}
											fill
											className="object-cover"
											sizes="(max-width: 1024px) 100vw, 320px"
										/>
									</div>
									<div className="flex flex-col justify-end p-5">
										<p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-cta">
											{moment.title}
										</p>
										<h3 className="mt-3 !font-sans text-xl font-medium leading-[1.08] tracking-[-0.035em] text-text">
											{moment.description}
										</h3>
									</div>
								</motion.article>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Problem;
