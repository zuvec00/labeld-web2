"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

// Using the same placeholder images for all items to demonstrate theme switching functionality
const previews = [
	{
		lightSrc: "/images/dashboard-mockup-light.jpeg",
		darkSrc: "/images/dashboard-mockup-dark.jpeg",
		alt: "Labeld Studio Dashboard",
		label: "Unified Dashboard",
	},
	{
		lightSrc: "/images/event-site-dark.jpeg",
		darkSrc: "/images/event-site-dark.jpeg",
		alt: "Event Page Preview",
		label: "Event Pages",
	},
	{
		lightSrc: "/images/brand-site-light.jpeg",
		darkSrc: "/images/brand-site-dark.jpeg",
		alt: "Brand Site Preview",
		label: "Brand Sites",
	},
];

const VisualProof = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start end", "end start"],
	});

	const y1 = useTransform(scrollYProgress, [0, 1], [40, -40]);
	const y2 = useTransform(scrollYProgress, [0, 1], [0, 0]);
	const y3 = useTransform(scrollYProgress, [0, 1], [-30, 30]);

	const yValues = [y1, y2, y3];

	return (
		<section ref={sectionRef} className="py-32 px-6 overflow-hidden">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
					className="mb-16 text-center"
				>
					<p className="mb-4 font-body text-sm font-medium uppercase tracking-[0.3em] text-cta">
						See It In Action
					</p>
					<h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
						Built Different. Looks Different.
					</h2>
				</motion.div>

				<div className="grid gap-6 md:grid-cols-3 items-start">
					{previews.map((preview, i) => (
						<motion.div
							key={preview.label}
							style={{ y: yValues[i] }}
							initial={{ opacity: 0, y: 50 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-40px" }}
							transition={{
								duration: 0.7,
								delay: i * 0.15,
								ease: [0.25, 0.1, 0.25, 1],
							}}
							whileHover={{ y: -8, transition: { duration: 0.3 } }}
							className="group overflow-hidden rounded-lg border border-border"
						>
							<div className="relative overflow-hidden aspect-[16/10] w-full bg-surface">
								<Image
									src={preview.lightSrc}
									alt={`${preview.alt} Light`}
									fill
									className="object-cover dark:hidden"
									loading="lazy"
								/>
								<Image
									src={preview.darkSrc}
									alt={`${preview.alt} Dark`}
									fill
									className="hidden object-cover dark:block"
									loading="lazy"
								/>
							</div>
							<div className="border-t border-border bg-surface px-5 py-4">
								<span className="font-heading text-xs font-medium tracking-wide text-muted-foreground">
									{preview.label}
								</span>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};

export default VisualProof;
