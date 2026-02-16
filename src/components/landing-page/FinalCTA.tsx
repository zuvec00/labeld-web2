"use client";

import { ButtonVite as Button } from "@/components/ui/buttonVite";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useRef } from "react";

const FinalCTA = () => {
	const ref = useRef<HTMLElement>(null);
	const router = useRouter();
	// Removed unused scroll logic from here

	return (
		<section ref={ref} className="py-32 px-6 overflow-hidden">
			<motion.div
				// Removed style={{ scale, opacity }}
				initial={{ opacity: 0, scale: 0.95 }}
				whileInView={{ opacity: 1, scale: 1 }}
				viewport={{ once: true }}
				transition={{ duration: 0.8 }}
				className="mx-auto max-w-3xl text-center"
			>
				<motion.h2
					initial={{ opacity: 0, y: 40 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
					className="font-heading text-4xl font-bold text-text sm:text-6xl"
				>
					Culture Doesn't Wait.
				</motion.h2>
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8, delay: 0.2 }}
					className="mx-auto mt-6 max-w-md font-body text-base text-muted-foreground"
				>
					Your brand is ready. Your audience is waiting. Start building with
					Labeld Studio today.
				</motion.p>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.4 }}
					className="mt-10"
				>
					<Button
						size="lg"
						className="bg-cta text-cta-foreground hover:bg-cta/90 font-heading text-sm tracking-wide px-10 h-12 transition-transform duration-200 hover:scale-[1.03]"
						onClick={() => router.push("/login")}
					>
						Start Building
					</Button>
				</motion.div>
			</motion.div>
		</section>
	);
};

export default FinalCTA;
