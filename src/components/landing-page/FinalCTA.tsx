"use client";

import { ButtonVite as Button } from "@/components/ui/buttonVite";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Smartphone } from "lucide-react";

const appStoreUrl = "https://apps.apple.com/app/id6760316742";

const checklist = [
	"Create your brand space",
	"Launch a drop or event",
	"Manage orders from Studio",
];

const FinalCTA = () => {
	const router = useRouter();

	return (
		<section className="overflow-hidden bg-surface px-5 py-16 sm:px-6 md:py-24">
			<motion.div
				initial={{ opacity: 0, y: 28 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.8 }}
				className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-bg"
			>
				<div className="grid gap-px bg-border lg:grid-cols-[1.1fr_0.9fr]">
					<div className="bg-bg p-7 md:p-12">
						<p className="mb-5 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-cta">
							Start your Studio
						</p>
						<h2 className="max-w-3xl !font-sans text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-text sm:text-5xl">
							Build the space. Sell the drop. Run the room.
						</h2>
						<p className="mt-6 max-w-2xl font-body text-base leading-7 text-text-muted">
							Your brand deserves more than scattered links and screenshots.
							Studio gives you the storefront, ticketing, orders, and analytics
							to move like a real operation.
						</p>
						<div className="mt-9 flex flex-col gap-3 sm:flex-row">
							<Button
								size="lg"
								className="h-12 rounded-full bg-foreground px-8 font-body text-sm font-bold tracking-[-0.01em] text-bg hover:bg-foreground/90"
								onClick={() => router.push("/login")}
							>
								Start Studio
								<ArrowRight className="h-4 w-4" />
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="h-12 rounded-full border-border bg-surface px-8 font-body text-sm font-bold tracking-[-0.01em] text-text hover:bg-bg"
								onClick={() => window.open(appStoreUrl, "_blank")}
							>
								<Smartphone className="h-4 w-4" />
								Download app
							</Button>
						</div>
					</div>
					<div className="bg-surface p-7 md:p-12">
						<p className="font-body text-sm font-semibold tracking-[-0.02em] text-text">
							Build fast on Labeld
						</p>
						<div className="mt-8 space-y-4">
							{checklist.map((item) => (
								<div key={item} className="flex items-center gap-3 border-b border-border pb-4 last:border-b-0">
									<CheckCircle2 className="h-4 w-4 text-accent" />
									<span className="text-sm text-text-muted">{item}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</motion.div>
		</section>
	);
};

export default FinalCTA;
