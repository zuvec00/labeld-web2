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
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<Button
							size="lg"
							className="bg-cta text-cta-foreground hover:bg-cta/90 font-heading text-sm tracking-wide px-10 h-12 transition-transform duration-200 hover:scale-[1.03]"
							onClick={() => router.push("/login")}
						>
							Start Building
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="border-border text-foreground hover:bg-surface font-heading text-sm tracking-wide px-10 h-12 transition-transform duration-200 hover:scale-[1.03] flex items-center gap-2"
							onClick={() => window.open("https://apps.apple.com/app/id6760316742", "_blank")}
						>
							<svg
								className="h-5 w-5"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.1 2.48-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17.05 2.5 11.45 4.3 8.3c.89-1.58 2.52-2.58 4.31-2.61 1.36-.02 2.65.92 3.48.92.84 0 2.41-1.12 4.05-.96.69.03 2.62.28 3.85 2.1-.1.06-2.3 1.35-2.28 4.01.02 3.19 2.77 4.3 2.8 4.31-.03.07-.44 1.5-.8 2.43zM14.28 5.7c-.73-.85-1.22-2.03-1.08-3.2.14-1.17.65-2.3 1.45-3.1.75-.85 1.95-1.4 3.1-1.3.15 1.23-.33 2.41-1.08 3.29-.75.89-1.99 1.48-3.12 1.44-.15-.05-.27-.05-.35-.13z" />
							</svg>
							App Store
						</Button>
					</div>
				</motion.div>
			</motion.div>
		</section>
	);
};

export default FinalCTA;
