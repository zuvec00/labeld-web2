/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import EventCard from "@/components/discover/EventCard";
import MomentCard from "@/components/discover/MomentCard";
import MerchCard from "@/components/discover/MerchCard";
import Button2, { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { fetchPublishedEvents } from "@/lib/firebase/queries/event";
import { fetchPublicMoments } from "@/lib/firebase/queries/moment";
import { fetchPublicMerch } from "@/lib/firebase/queries/merch";
import { Spinner } from "@/components/ui/spinner";
import {
	getAuth,
	signInAnonymously,
	onAuthStateChanged,
	User,
} from "firebase/auth";

export default function DiscoverPage() {
	const [sortBy, setSortBy] = useState("date");
	const [loading, setLoading] = useState(true);
	const [authLoading, setAuthLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const [events, setEvents] = useState<any[]>([]);
	const [moments, setMoments] = useState<any[]>([]);
	const [merch, setMerch] = useState<any[]>([]);
	const router = useRouter();
	const auth = getAuth();

	// Handle authentication state
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				setUser(user);
			} else {
				// Sign in anonymously if no user
				try {
					await signInAnonymously(auth);
				} catch (error) {
					console.error("Error signing in anonymously:", error);
				}
			}
			setAuthLoading(false);
		});

		return () => unsubscribe();
	}, [auth]);

	useEffect(() => {
		async function fetchData() {
			try {
				setLoading(true);
				const [eventsData, momentsData, merchData] = await Promise.all([
					fetchPublishedEvents(),
					fetchPublicMoments(),
					fetchPublicMerch(),
				]);

				setEvents(eventsData);
				setMoments(momentsData);
				setMerch(merchData);
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setLoading(false);
			}
		}

		// Only fetch data after auth is ready
		if (!authLoading) {
			fetchData();
		}
	}, [authLoading]);

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-bg text-text flex items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<main className="container mx-auto px-10 sm:px-10 lg:px-10 py-4">
			{/* Hero Section with Background Image */}
			<div className="relative mb-16 rounded-3xl">
				{/* Background Image */}
				<div className="absolute inset-0">
					<img
						src="/images/event-bg3.jpg"
						alt="Culture Background"
						className="w-full h-full object-cover"
					/>
					{/* Gradient overlay for text legibility */}
					<div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent"></div>
				</div>

				{/* Bleeding Image Layer - Bottom Right */}
				<div className="absolute -bottom-12 -right-8 hidden lg:block">
					<img
						src="/images/ad2.png"
						alt="Overlay Image"
						className="w-110 h-120 object-cover "
						style={{
							zIndex: 5,
						}}
					/>
				</div>

				{/* Content */}
				<div className="relative z-10 p-12 md:p-16 lg:p-20">
					<div className="max-w-2xl">
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 text-white">
							Discover the
							<span className="text-accent text-glow block">Culture</span>
						</h1>
						<p className="text-gray-200 text-lg md:text-xl max-w-xl font-manrope mb-8">
							Explore events, moments, and merch from the Labeld community
						</p>

						{/* App Download Buttons */}
						<div className="flex flex-col sm:flex-row gap-4 mb-8">
							<button
								className="bg-cta hover:bg-cta/90 text-white font-heading font-normal px-8 py-2 rounded-xl text-lg transition-all duration-300 hover:shadow-glow group drop-shadow-lg"
								onClick={() =>
									window.open(
										"https://apps.apple.com/ng/app/labeld/id6748664223",
										"_blank"
									)
								}
							>
								<span className="flex items-center justify-center gap-3">
									<img
										src="/apple_logo.svg"
										alt="Apple logo"
										className="h-7 w-7 object-contain align-middle"
										style={{
											display: "inline-block",
											verticalAlign: "middle",
											filter: "invert(1)",
										}}
									/>
									<span className="flex flex-col items-start gap-0">
										<span
											className="text-xs text-gray-200 font-medium leading-none"
											style={{ fontFamily: "var(--font-manrope)" }}
										>
											Download on the
										</span>
										<span className="text-base font-semibold font-unbounded text-white leading-tight">
											App Store
										</span>
									</span>
								</span>
							</button>

							<button
								className="bg-accent hover:bg-accent/90 text-jet-black font-unbounded font-normal px-8 py-3 rounded-xl text-lg transition-all duration-300 hover:shadow-glow group drop-shadow-lg"
								onClick={() => {
									window.open("https://labeld.app/", "_blank");
								}}
							>
								<span className="flex items-center justify-center gap-3">
									<img
										src="/android_logo_fill.svg"
										alt="Android logo"
										className="h-5 w-5 object-contain align-middle"
										style={{
											display: "inline-block",
											verticalAlign: "middle",
										}}
									/>
									<span className="flex items-center gap-2">
										<span className="text-bg">Join Android Beta</span>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 20 20"
											className="w-5 h-5 transition-transform group-hover:translate-x-1"
										>
											<path
												stroke="#0B0B0B"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M7.5 12.5L12.5 7.5M12.5 7.5H8.5M12.5 7.5V11.5"
											/>
										</svg>
									</span>
								</span>
							</button>
						</div>

						<p className="text-sm text-gray-300 font-manrope">
							Be the first to try the Android beta app before the official
							launch.
						</p>
					</div>
				</div>
			</div>

			{/* Curated Section: This Weekend Events */}
			<section className="mb-16 bg-surface/30 rounded-3xl p-8 border border-stroke/50">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-heading font-bold text-text mb-2">
							🔥 Happening This Weekend
						</h2>
						<p className="text-text-muted font-manrope">
							Don&apos;t miss these upcoming events
						</p>
					</div>
					<a
						href="/e/all-events"
						target="_blank"
						rel="noopener noreferrer"
						className="text-md text-text-muted underline inline-flex items-center gap-1 hover:text-accent transition-colors"
					>
						See all events
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 20 20"
							className="w-4 h-4 ml-1"
						>
							<path
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M7.5 12.5L12.5 7.5M12.5 7.5H8.5M12.5 7.5V11.5"
							/>
						</svg>
					</a>
				</div>
				<div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
					{events.slice(0, 5).map((event) => (
						<div key={event.id} className="flex-shrink-0 w-100">
							<EventCard event={event} />
						</div>
					))}
				</div>
			</section>

			{/* Curated Section: Fresh Drops */}
			<section className="mb-16 bg-surface/30 rounded-3xl p-8 border border-stroke/50">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-heading font-bold text-text mb-2">
							⚡ Fresh Drops
						</h2>
						<p className="text-text-muted font-manrope">
							Latest merch from your favorite events
						</p>
					</div>
					<a
						href="/e/all-merch"
						target="_blank"
						rel="noopener noreferrer"
						className="text-md text-text-muted underline inline-flex items-center gap-1 hover:text-accent transition-colors"
					>
						See all merch
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 20 20"
							className="w-4 h-4 ml-1"
						>
							<path
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M7.5 12.5L12.5 7.5M12.5 7.5H8.5M12.5 7.5V11.5"
							/>
						</svg>
					</a>
				</div>
				<div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
					{merch.slice(0, 5).map((item) => (
						<div key={item.id} className="flex-shrink-0 w-80">
							<MerchCard merch={item} />
						</div>
					))}
				</div>
			</section>

			{/* Curated Section: From Last Night */}
			<section className="mb-16 bg-surface/30 rounded-3xl p-8 border border-stroke/50">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-heading font-bold text-text mb-2">
							🌙 From Last Night
						</h2>
						<p className="text-text-muted font-manrope">
							Recent moments and memories
						</p>
					</div>
					<a
						href="/e/all-moments"
						target="_blank"
						rel="noopener noreferrer"
						className="text-md text-text-muted underline inline-flex items-center gap-1 hover:text-accent transition-colors"
					>
						See all moments
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 20 20"
							className="w-4 h-4 ml-1"
						>
							<path
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M7.5 12.5L12.5 7.5M12.5 7.5H8.5M12.5 7.5V11.5"
							/>
						</svg>
					</a>
				</div>
				<div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
					{moments.slice(0, 5).map((moment) => (
						<div key={moment.id} className="flex-shrink-0 w-80">
							<MomentCard moment={moment} />
						</div>
					))}
				</div>
			</section>

			{/* All Events Section */}
			<section className="mb-16">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-heading font-normal text-text">
						All Upcoming Events
					</h2>
					<a
						href="/e/all-events"
						target="_blank"
						rel="noopener noreferrer"
						className="text-md text-text-muted underline inline-flex items-center gap-1 hover:text-accent transition-colors"
					>
						See all events
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 20 20"
							className="w-4 h-4 ml-1"
						>
							<path
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M7.5 12.5L12.5 7.5M12.5 7.5H8.5M12.5 7.5V11.5"
							/>
						</svg>
					</a>
				</div>
				<div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
					{events.map((event) => (
						<div key={event.id} className="flex-shrink-0 w-100">
							<EventCard event={event} />
						</div>
					))}
				</div>
			</section>

			{/* All Moments Section */}
			<section className="mb-16">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-heading font-normal text-text">
						All Event Moments
					</h2>
					<a
						href="/e/all-moments"
						target="_blank"
						rel="noopener noreferrer"
						className="text-md text-text-muted underline inline-flex items-center gap-1 hover:text-accent transition-colors"
					>
						See all moments
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 20 20"
							className="w-4 h-4 ml-1"
						>
							<path
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M7.5 12.5L12.5 7.5M12.5 7.5H8.5M12.5 7.5V11.5"
							/>
						</svg>
					</a>
				</div>
				<div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
					{moments.map((moment) => (
						<div key={moment.id} className="flex-shrink-0 w-80">
							<MomentCard moment={moment} />
						</div>
					))}
				</div>
			</section>

			{/* All Merch Section */}
			<section className="mb-16">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-heading font-normal text-text">
						All Event Merch
					</h2>
					<a
						href="/e/all-merch"
						target="_blank"
						rel="noopener noreferrer"
						className="text-md text-text-muted underline inline-flex items-center gap-1 hover:text-accent transition-colors"
					>
						See all merch
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 20 20"
							className="w-4 h-4 ml-1"
						>
							<path
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M7.5 12.5L12.5 7.5M12.5 7.5H8.5M12.5 7.5V11.5"
							/>
						</svg>
					</a>
				</div>
				<div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
					{merch.map((item) => (
						<div key={item.id} className="flex-shrink-0 w-80">
							<MerchCard merch={item} />
						</div>
					))}
				</div>
			</section>
		</main>
	);
}
