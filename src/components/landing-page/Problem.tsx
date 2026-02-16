"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const Problem = () => {
	const ref = useRef<HTMLElement>(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"],
	});
	const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [1, 1, 1, 1]);
	const scale = useTransform(
		scrollYProgress,
		[0, 0.2, 0.8, 1],
		[0.8, 1, 1, 0.8],
	);

	return (
		<section ref={ref} className="py-32 px-6 overflow-hidden">
			<motion.div
				style={{ opacity, scale }}
				className="mx-auto max-w-3xl text-center"
			>
				<motion.h2
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
					className="font-heading text-3xl font-bold text-foreground sm:text-5xl"
				>
					<motion.span
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="block text-foreground"
					>
						Too Many Tools.
					</motion.span>
					<motion.span
						initial={{ opacity: 0, x: 20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.25 }}
						className="block text-muted-foreground"
					>
						No Control.
					</motion.span>
				</motion.h2>

				<div className="mx-auto mt-10 max-w-xl space-y-4">
					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8, delay: 0.4 }}
						className="font-body text-base leading-relaxed text-muted-foreground"
					>
						Fragmented platforms. Generic templates that strip your brand.
						Disconnected ticketing, payments, and storefronts that don't talk to
						each other.
					</motion.p>
					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8, delay: 0.55 }}
						className="font-body text-base leading-relaxed text-muted-foreground"
					>
						You end up managing five tools when one should be enough.
					</motion.p>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.95 }}
					whileInView={{ opacity: 1, y: 0, scale: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.7 }}
					className="mt-12 inline-flex items-center gap-3 rounded-lg border border-border bg-surface px-6 py-3"
				>
					<motion.div
						animate={{ scale: [1, 1.3, 1] }}
						transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
						className="h-2 w-2 rounded-full bg-accent"
					/>
					<span className="font-heading text-sm font-medium text-text">
						Labeld Studio brings it together.
					</span>
				</motion.div>
			</motion.div>
		</section>
	);
};

export default Problem;
