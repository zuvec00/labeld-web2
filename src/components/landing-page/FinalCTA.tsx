"use client";

import { ButtonVite as Button } from "@/components/ui/buttonVite";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ArrowRight, Smartphone } from "lucide-react";

const FinalCTA = () => {
	const ref = useRef<HTMLElement>(null);
	const router = useRouter();
	// Removed unused scroll logic from here

	return (
		<section ref={ref} className="overflow-hidden bg-surface px-6 py-20 md:py-28">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				whileInView={{ opacity: 1, scale: 1 }}
				viewport={{ once: true }}
				transition={{ duration: 0.8 }}
				className="mx-auto max-w-5xl border border-border bg-bg p-8 text-center md:p-14"
			>
				<p className="mb-5 font-body text-[11px] font-bold uppercase tracking-[0.28em] text-cta">
					Start the control room
				</p>
				<motion.h2
					initial={{ opacity: 0, y: 40 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
					className="font-heading text-3xl font-semibold uppercase leading-[1.05] text-text sm:text-5xl"
				>
					Build the space. Sell the drop. Run the room.
				</motion.h2>
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8, delay: 0.2 }}
					className="mx-auto mt-6 max-w-2xl font-body text-base leading-relaxed text-muted-foreground"
				>
					Your brand needs a real operating system. Studio gives you the
					storefront, ticketing, orders, and analytics to move like one.
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
							className="h-12 bg-cta px-8 font-heading text-xs uppercase tracking-[0.16em] text-white hover:bg-cta/90"
							onClick={() => router.push("/login")}
						>
							Start Building
							<ArrowRight className="h-4 w-4" />
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="flex h-12 items-center gap-2 border-border bg-surface px-8 font-heading text-xs uppercase tracking-[0.16em] text-foreground hover:bg-bg"
							onClick={() => window.open("https://apps.apple.com/app/id6760316742", "_blank")}
						>
							<Smartphone className="h-4 w-4" />
							Download Studio App
						</Button>
					</div>
				</motion.div>
			</motion.div>
		</section>
	);
};

export default FinalCTA;
