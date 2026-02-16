"use client";

import { ButtonVite } from "@/components/ui/buttonVite";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// import dashboardMockup from "@/assets/dashboard-mockup.png"; // Placeholder for now

const Hero = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const router = useRouter();

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<section
			ref={sectionRef}
			className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-22 overflow-hidden"
		>
			{/* Animated grid background */}
			<motion.div
				className="absolute inset-0"
				style={{
					opacity: 0.03, // Static opacity instead of scroll-linked
					backgroundImage:
						"linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
					backgroundSize: "60px 60px",
				}}
			/>

			{/* Radial glow */}
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 2, ease: "easeOut" }}
				className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
				style={{
					background:
						"radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
				}}
			/>

			<motion.div className="relative z-10 mx-auto max-w-5xl text-center">
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.1 }}
					className="mb-6 font-body text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground"
				>
					The Platform for Culture
				</motion.p>

				<h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl overflow-hidden">
					<motion.span
						initial={{ opacity: 0, y: 60 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.8,
							delay: 0.2,
							ease: [0.25, 0.1, 0.25, 1],
						}}
						className="block"
					>
						Build Your Space.
					</motion.span>
					<motion.span
						initial={{ opacity: 0, y: 60 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.8,
							delay: 0.35,
							ease: [0.25, 0.1, 0.25, 1],
						}}
						className="block text-cta"
					>
						Sell Your Culture.
					</motion.span>
				</h1>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1, delay: 0.6 }}
					className="mx-auto mt-8 max-w-2xl font-body text-lg leading-relaxed text-muted-foreground"
				>
					Labeld Studio gives independent brands and organizers the tools to
					launch, manage, and grow — without losing their identity.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.8 }}
					className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
				>
					<ButtonVite
						size="lg"
						className="bg-cta text-text hover:bg-cta/90 font-heading text-sm tracking-wide px-8 h-12 transition-transform duration-200 hover:scale-[1.03]"
						onClick={() => router.push("/login")}
					>
						Start Your Studio
					</ButtonVite>
					<ButtonVite
						size="lg"
						variant="outline"
						className="border-border text-foreground hover:bg-surface font-heading text-sm tracking-wide px-8 h-12 transition-transform duration-200 hover:scale-[1.03]"
					>
						View Demo
					</ButtonVite>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 80, scale: 0.95 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 1.2, delay: 1, ease: [0.25, 0.1, 0.25, 1] }}
					className="mt-20"
				>
					<div className="relative mx-auto max-w-4xl overflow-hidden rounded-lg border border-border shadow-2xl shadow-cta/5 bg-bg">
						<div className="relative aspect-[16/10] w-full">
							<Image
								src="/images/dashboard-mockup-light.jpeg"
								alt="Labeld Studio Dashboard Light"
								fill
								className="object-cover dark:hidden"
								priority
							/>
							<Image
								src="/images/dashboard-mockup-dark.jpeg"
								alt="Labeld Studio Dashboard Dark"
								fill
								className="hidden object-cover dark:block"
								priority
							/>
						</div>
						<div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
					</div>
				</motion.div>
			</motion.div>
		</section>
	);
};

export default Hero;
