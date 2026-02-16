"use client";

import { motion } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { useState } from "react";
import { ButtonVite } from "@/components/ui/buttonVite";
import { PRICING_CONTENT } from "@/app/pricing/pricingData";
import { useRouter } from "next/navigation";

const BILLING_OPTIONS = [
	{ id: "monthly", label: "Monthly", price: "₦5,000", period: "/ month" },
	{
		id: "quarterly",
		label: "Quarterly",
		price: "₦13,500",
		period: "/ 3 months",
		originalPrice: "₦15,000",
		saveLabel: "Save ₦1,500",
	},
	{
		id: "biannual",
		label: "Bi-Annual",
		price: "₦26,500",
		period: "/ 6 months",
		originalPrice: "₦30,000",
		saveLabel: "Save ₦3,500",
	},
	{
		id: "annual",
		label: "Annual",
		price: "₦50,000",
		period: "/ year",
		popular: true,
		originalPrice: "₦60,000",
		saveLabel: "Save ₦10,000",
	},
] as const;

const Pricing = () => {
	const [billing, setBilling] =
		useState<(typeof BILLING_OPTIONS)[number]["id"]>("annual");
	const selectedPlan = BILLING_OPTIONS.find((p) => p.id === billing)!;

	return (
		<section id="pricing" className="py-32 px-6">
			<div className="mx-auto max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
					className="mb-12 text-center"
				>
					<p className="mb-4 font-body text-sm font-medium uppercase tracking-[0.3em] text-cta">
						Pricing
					</p>
					<h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
						Simple. Transparent. Fair.
					</h2>
				</motion.div>

				{/* Billing Toggle */}
				<div className="mb-16 flex justify-center">
					<div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
						{BILLING_OPTIONS.map((option) => (
							<button
								key={option.id}
								onClick={() => setBilling(option.id)}
								className={`!font-sans rounded-md px-4 py-2 font-body text-xs font-medium transition-all ${
									billing === option.id
										? "bg-cta text-cta-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				{/* Brands Section */}
				<div className="mb-20">
					<div className="mb-8 text-center md:text-left">
						<h3 className="font-heading text-2xl font-bold text-foreground">
							For Brands
						</h3>
						<p className="mt-2 text-muted-foreground max-w-2xl text-sm">
							{PRICING_CONTENT.brand.hero.subtext}
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto md:mx-0">
						{/* Brand Free Plan */}
						<PlanCard
							name={PRICING_CONTENT.brand.plans.free.title}
							price={PRICING_CONTENT.brand.plans.free.price}
							period="/ month"
							description={PRICING_CONTENT.brand.plans.free.description}
							domainPreview={{
								prefix: "shop.labeld.app/",
								highlight: "yourbrand",
							}}
							features={PRICING_CONTENT.brand.plans.free.features}
							buttonText={PRICING_CONTENT.brand.hero.ctaFree}
							delay={0.1}
						/>

						{/* Brand Pro Plan */}
						<PlanCard
							name={PRICING_CONTENT.brand.plans.pro.title}
							price={selectedPlan.price}
							period={selectedPlan.period}
							originalPrice={
								"originalPrice" in selectedPlan
									? selectedPlan.originalPrice
									: undefined
							}
							saveLabel={
								"saveLabel" in selectedPlan ? selectedPlan.saveLabel : undefined
							}
							description={PRICING_CONTENT.brand.plans.pro.description}
							domainPreview={{
								highlight: "yourbrand",
								suffix: ".labeld.app",
							}}
							features={[
								...PRICING_CONTENT.brand.plans.pro.ownershipFeatures,
								...PRICING_CONTENT.brand.plans.pro.customizationFeatures,
								...PRICING_CONTENT.brand.plans.pro.analyticsFeatures,
							]}
							buttonText={PRICING_CONTENT.brand.hero.ctaPro}
							popular={true}
							badge={PRICING_CONTENT.brand.plans.pro.badge}
							delay={0.2}
							theme="accent"
						/>
					</div>
				</div>

				{/* Organizers Section */}
				<div>
					<div className="mb-8 text-center md:text-left">
						<h3 className="font-heading text-2xl font-bold text-foreground">
							For Organizers
						</h3>
						<p className="mt-2 text-muted-foreground max-w-2xl text-sm">
							{PRICING_CONTENT.organizer.hero.subtext}
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto md:mx-0">
						{/* Organizer Free Plan */}
						<PlanCard
							name={PRICING_CONTENT.organizer.plans.free.title}
							price={PRICING_CONTENT.organizer.plans.free.price}
							period="/ month"
							description={PRICING_CONTENT.organizer.plans.free.description}
							domainPreview={{
								prefix: "events.labeld.app/",
								highlight: "yourevent",
							}}
							features={PRICING_CONTENT.organizer.plans.free.features}
							buttonText={PRICING_CONTENT.organizer.hero.ctaFree}
							delay={0.3}
						/>

						{/* Organizer Pro Plan */}
						<PlanCard
							name={PRICING_CONTENT.organizer.plans.pro.title}
							price={selectedPlan.price}
							period={selectedPlan.period}
							originalPrice={
								"originalPrice" in selectedPlan
									? selectedPlan.originalPrice
									: undefined
							}
							saveLabel={
								"saveLabel" in selectedPlan ? selectedPlan.saveLabel : undefined
							}
							description={PRICING_CONTENT.organizer.plans.pro.description}
							domainPreview={{
								highlight: "yourevent",
								suffix: ".labeld.app",
							}}
							features={[
								...PRICING_CONTENT.organizer.plans.pro.ownershipFeatures,
								...PRICING_CONTENT.organizer.plans.pro.customizationFeatures,
								...PRICING_CONTENT.organizer.plans.pro.analyticsFeatures,
							]}
							buttonText={PRICING_CONTENT.organizer.hero.ctaPro}
							popular={true}
							badge={PRICING_CONTENT.organizer.plans.pro.badge}
							delay={0.4}
							theme="events"
						/>
					</div>
				</div>
			</div>
		</section>
	);
};

interface PlanCardProps {
	name: string;
	price: string;
	period: string;
	originalPrice?: string;
	saveLabel?: string;
	description: string;
	domainPreview?: {
		prefix?: string;
		highlight: string;
		suffix?: string;
	};
	features: string[];
	buttonText: string;
	popular?: boolean;
	badge?: string;
	delay: number;
	theme?: "cta" | "accent" | "events"; // Added theme prop
}

const PlanCard = ({
	name,
	price,
	period,
	originalPrice,
	saveLabel,
	description,
	domainPreview,
	features,
	buttonText,
	popular,
	badge,
	delay,
	theme = "cta",
}: PlanCardProps) => {
	const router = useRouter();
	// Theme color mapping
	const themeColors = {
		cta: {
			border: "border-cta",
			text: "text-cta",
			bg: "bg-cta",
			buttonText: "text-white",
			bgLight: "bg-cta/10",
			bgVeryLight: "bg-cta/5",
			borderLight: "border-cta/20",
		},
		accent: {
			border: "border-accent",
			text: "text-accent",
			bg: "bg-accent",
			buttonText: "text-bg", // Dark text on lime green
			bgLight: "bg-accent/10",
			bgVeryLight: "bg-accent/5",
			borderLight: "border-accent/20",
		},
		events: {
			border: "border-events",
			text: "text-events",
			bg: "bg-events",
			buttonText: "text-white",
			bgLight: "bg-events/10",
			bgVeryLight: "bg-events/5",
			borderLight: "border-events/20",
		},
	}[theme];

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.6, delay }}
			className={`relative flex flex-col rounded-lg border p-8 ${
				popular
					? `${themeColors.border} bg-surface`
					: "border-border bg-surface"
			}`}
		>
			{popular && badge && (
				<div className="absolute -top-3 left-8">
					<span className="rounded-full bg-secondary px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground">
						{badge}
					</span>
				</div>
			)}
			<h3 className="font-heading text-sm font-semibold text-foreground">
				{name}
			</h3>
			<div className="mt-4 flex flex-col items-start gap-1">
				<div className="flex items-baseline gap-1">
					<span className="font-heading text-4xl font-bold text-foreground">
						{price}
					</span>
					<span className="font-body text-sm text-muted-foreground">
						{period}
					</span>
				</div>
				{originalPrice && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">
							{originalPrice}
						</span>
						{saveLabel && (
							<span
								className={`text-[10px] font-bold ${themeColors.text} ${themeColors.bgLight} px-2 py-0.5 rounded-full uppercase tracking-wide`}
							>
								{saveLabel}
							</span>
						)}
					</div>
				)}
			</div>
			<p className="mt-4 text-sm text-muted-foreground leading-relaxed">
				{description}
			</p>

			{domainPreview && (
				<div
					className={`mt-4 ${themeColors.bgVeryLight} border ${themeColors.borderLight} rounded-lg px-3 py-2 flex items-center gap-2 font-mono text-xs overflow-hidden`}
				>
					<Globe
						className={`h-3.5 w-3.5 ${themeColors.text} shrink-0`}
						strokeWidth={2}
					/>
					<span className="truncate text-foreground/80">
						{domainPreview.prefix}
						<span className={`${themeColors.text} font-bold`}>
							{domainPreview.highlight}
						</span>
						{domainPreview.suffix}
					</span>
				</div>
			)}

			<ul className="mt-8 space-y-3 flex-1">
				{features.map((feature) => (
					<li key={feature} className="flex items-start gap-3">
						<Check
							className={`h-4 w-4 ${themeColors.text} shrink-0 mt-0.5`}
							strokeWidth={2}
						/>
						<span className="font-body text-sm text-muted-foreground">
							{feature}
						</span>
					</li>
				))}
			</ul>
			<ButtonVite
				onClick={() => router.push("/login")}
				className={`mt-8 w-full font-heading text-xs tracking-wide ${
					popular
						? `${themeColors.bg} ${themeColors.buttonText} hover:opacity-90`
						: "bg-background text-foreground border border-border hover:bg-muted"
				}`}
			>
				{buttonText}
			</ButtonVite>
		</motion.div>
	);
};

export default Pricing;
