"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, Ticket, Users } from "lucide-react";
import Button, { Button2 } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// swap these with your real assets (public/…)
const backgroundImages = [
	"/images/event_landing_page.jpg",
	// "/hero_2.JPEG",
	// "/hero_3.jpg",
	// "/hero_4.jpg",
];

export default function TicketingIndex() {
	const router = useRouter();

	// hero background crossfade state
	const [currentImageIndex, setCurrentImageIndex] = useState(
		Math.floor(Math.random() * backgroundImages.length)
	);
	const [nextImageIndex, setNextImageIndex] = useState(
		(Math.floor(Math.random() * backgroundImages.length) + 1) %
			backgroundImages.length
	);
	const [isTransitioning, setIsTransitioning] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			setIsTransitioning(true);
			// half of transition duration (see duration-1000 below)
			const t = setTimeout(() => {
				setCurrentImageIndex(nextImageIndex);
				setNextImageIndex((nextImageIndex + 1) % backgroundImages.length);
				setIsTransitioning(false);
			}, 500);
			return () => clearTimeout(t);
		}, Math.random() * 3000 + 5000); // 5–8s
		return () => clearInterval(interval);
	}, [nextImageIndex]);

	return (
		<div className="min-h-dvh bg-bg">
			{/* HERO with background */}
			<section className="relative overflow-hidden min-h-[50vh] flex items-center justify-center mb-12">
				{/* Background layers */}
				<div className="absolute inset-0 z-0">
					{/* Current */}
					<div
						className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
						style={{
							backgroundImage: `url(${backgroundImages[currentImageIndex]})`,
							opacity: isTransitioning ? 0 : 1,
						}}
					/>
					{/* Next */}
					<div
						className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
						style={{
							backgroundImage: `url(${backgroundImages[nextImageIndex]})`,
							opacity: isTransitioning ? 1 : 0,
						}}
					/>
					{/* Gradient overlays for legibility */}
					<div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/65" />
					<div className="absolute inset-0 bg-black/20" />
				</div>

				{/* Hero content */}
				<header className="relative z-10 px-4 sm:px-6 py-16 md:py-24 max-w-6xl mx-auto text-center">
					<h1 className="font-heading font-bold text-4xl md:text-5xl text-white tracking-tight drop-shadow">
						Throw <span className="text-accent">Events</span>, Build{" "}
						<span className="text-cta">Culture</span>
					</h1>
					<p className="text-lg md:text-xl text-gray-200 mt-4 max-w-2xl mx-auto">
						Labeld makes ticketing feel less like receipts and more like the
						vibe — hype, merch, and moments all in one flow.
					</p>

					<div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
						{/* <Button2
							variant="cta"
							onClick={() => router.push("/events")}
							text="Browse Events"
							leftIcon={<Calendar className="w-4 h-4" />}
						/> */}

						<Button2
							variant="primary"
							onClick={() => router.push("/events/create/details")}
							text="Create Event"
							leftIcon={<Ticket className="w-4 h-4" />}
						/>
					</div>
				</header>
			</section>

			{/* FEATURES */}
			<main className="px-4 sm:px-6 pb-20 max-w-6xl mx-auto">
				<section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
					<FeatureCard
						icon={<Calendar className="w-10 h-10 text-cta" />}
						title="Event Drops"
						desc="Craft your event like a drop: clean flow, your style."
					/>
					<FeatureCard
						icon={<Ticket className="w-10 h-10 text-cta" />}
						title="Vibe Tickets"
						desc="Flexible tiers (Energy, Crew, All-Access) that fit the mood."
					/>
					<FeatureCard
						icon={<Users className="w-10 h-10 text-cta" />}
						title="Moments & Crew"
						desc="Let your crowd share hype, connect, and live the culture."
					/>
				</section>

				{/* Sub‑CTA band */}
				<section className="mt-12 md:mt-16 rounded-2xl bg-surface border border-stroke px-6 py-8 text-center">
					<h2 className="font-heading font-semibold text-xl text-text">
						Ready to drop your first event?
					</h2>
					<p className="text-text-muted mt-2">
						Start with details, add tickets, then hype it with Moments — all in
						Labeld.
					</p>
					<div className="mt-6">
						<Button
							variant="primary"
							onClick={() => router.push("/events/create/details")}
							text="Get Started"
						/>
					</div>
				</section>
			</main>
		</div>
	);
}

function FeatureCard({
	icon,
	title,
	desc,
}: {
	icon: React.ReactNode;
	title: string;
	desc: string;
}) {
	return (
		<div className="bg-surface border border-stroke rounded-2xl p-6 text-center">
			<div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-bg border border-stroke">
				{icon}
			</div>
			<h3 className="font-heading font-semibold text-lg text-text">{title}</h3>
			<p className="text-text-muted mt-2">{desc}</p>
		</div>
	);
}
