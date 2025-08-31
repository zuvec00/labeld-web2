/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, MapPin } from "lucide-react";
import { fetchEventById } from "@/lib/firebase/queries/event";
import { Spinner } from "@/components/ui/spinner";
import {
	getAuth,
	signInAnonymously,
	onAuthStateChanged,
	User,
} from "firebase/auth";

// Import fetchPublicMoments and MomentCard for event moments
import { fetchPublicMoments } from "@/lib/firebase/queries/moment";
import MomentCard from "@/components/discover/MomentCard";
// Import fetchPublicMerch and MerchCard for event merch
import { fetchPublicMerch } from "@/lib/firebase/queries/merch";
import MerchCard from "@/components/discover/MerchCard";

export default function EventDetailPage() {
	const params = useParams();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [authLoading, setAuthLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const [event, setEvent] = useState<any>(null);
	const [moments, setMoments] = useState<any[]>([]);
	const [momentsLoading, setMomentsLoading] = useState(true);
	const [merch, setMerch] = useState<any[]>([]);
	const [merchLoading, setMerchLoading] = useState(true);
	const auth = getAuth();

	// Parse the slug to extract event ID
	const slug = params.slug as string;
	const eventId = slug?.split("-")[0]; // Get the ID part before the first dash

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

	// Fetch event data
	useEffect(() => {
		async function fetchEventData() {
			if (!eventId) return;

			try {
				setLoading(true);
				const eventData = await fetchEventById(eventId);
				setEvent(eventData);
			} catch (error) {
				console.error("Error fetching event:", error);
			} finally {
				setLoading(false);
			}
		}

		// Only fetch data after auth is ready
		if (!authLoading && eventId) {
			fetchEventData();
		}
	}, [authLoading, eventId]);

	// Fetch event moments
	useEffect(() => {
		async function fetchEventMoments() {
			if (!eventId) return;
			try {
				setMomentsLoading(true);
				const allMoments = await fetchPublicMoments();
				// Filter moments for this event
				const filtered = allMoments.filter(
					(m: any) => m.eventId === eventId || m.event?.id === eventId // fallback if moment has event object
				);
				setMoments(filtered);
			} catch (error) {
				console.error("Error fetching event moments:", error);
			} finally {
				setMomentsLoading(false);
			}
		}
		if (!authLoading && eventId) {
			fetchEventMoments();
		}
	}, [authLoading, eventId]);

	// Fetch event merch
	useEffect(() => {
		async function fetchEventMerch() {
			if (!eventId) return;
			try {
				setMerchLoading(true);
				const allMerch = await fetchPublicMerch();
				// Filter merch for this event
				const filtered = allMerch.filter(
					(m: any) => m.eventId === eventId || m.event?.id === eventId // fallback if merch has event object
				);
				setMerch(filtered);
			} catch (error) {
				console.error("Error fetching event merch:", error);
			} finally {
				setMerchLoading(false);
			}
		}
		if (!authLoading && eventId) {
			fetchEventMerch();
		}
	}, [authLoading, eventId]);

	// Format date
	const formatDate = (date: any) => {
		if (!date) return "TBD";
		const eventDate = date.toDate ? date.toDate() : new Date(date);
		return eventDate.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Format time
	const formatTime = (date: any) => {
		if (!date) return "TBD";
		const eventDate = date.toDate ? date.toDate() : new Date(date);
		return eventDate.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-bg text-text flex items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!event) {
		return (
			<div className="min-h-screen bg-bg text-text flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-heading font-bold mb-4">
						Event Not Found
					</h1>
					<p className="text-text-muted">
						The event you&apos;re looking for doesn&apos;t exist.
					</p>
				</div>
			</div>
		);
	}

	return (
		<main className="container mx-auto px-10 sm:px-10 lg:px-10 py-8">
			{/* Breadcrumb */}
			<div className="mb-8">
				<nav className="text-sm text-text-muted">
					<span>Discover</span>
					<span className="mx-2">/</span>
					<span className="text-text">{event.title}</span>
				</nav>
			</div>

			{/* Event Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Left Column - Cover Image and Ticket Button */}
				<div className="space-y-6 lg:col-span-1 flex-1">
					{/* Cover Image */}
					<div className="mx-auto aspect-[4/5] max-w-full bg-gray-800 rounded-2xl overflow-hidden">
						{event.coverImageURL ? (
							<img
								src={event.coverImageURL}
								alt={event.title}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-gray-500">
								<span className="text-lg">No Image Available</span>
							</div>
						)}
					</div>

					{/* Get Ticket Button */}
					<button
						className="w-full bg-cta hover:bg-cta/90 text-white font-heading font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 hover:shadow-glow"
						onClick={() => {
							router.push(`/buy/${eventId}/tickets`);
						}}
					>
						Get a Ticket
					</button>
				</div>

				{/* Right Column - Event Details */}
				<div className="space-y-6 lg:col-span-2 flex-2">
					{/* Event Title */}
					<h1 className="text-2xl lg:text-3xl font-heading font-bold text-text">
						{event.title}
					</h1>

					{/* Event Metadata */}
					<div className="space-y-4 text-lg">
						{/* Date */}
						<div className="flex items-center gap-3">
							<Calendar className="h-5 w-5 text-text" />
							<span className="text-text font-medium">
								{formatDate(event.startAt)}
							</span>
						</div>

						{/* Time */}
						<div className="flex items-center gap-3">
							<Clock className="h-5 w-5 text-text" />
							<span className="text-text font-medium">
								{formatTime(event.startAt)} - {formatTime(event.endAt)} UTC
							</span>
						</div>

						{/* Location */}
						<div className="flex items-center gap-3">
							<MapPin className="h-5 w-5 text-text" />
							<div>
								<div className="text-text font-medium">
									{event.venue?.name || "Venue TBD"}
								</div>
								<div className="text-text-muted text-sm">
									{event.venue?.address}, {event.venue?.state}
								</div>
							</div>
						</div>
						<hr className="my-6 border-t border-stroke" />

						{/* Event Moments Section */}
						<div>
							<p className="text-md font-sans font-semibold mb-4 text-text-muted">
								Event Moments
							</p>
							{momentsLoading ? (
								<div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
									{[1, 2, 3].map((i) => (
										<div
											key={i}
											className="flex-shrink-0 w-80 h-48 rounded-2xl bg-surface animate-pulse flex flex-col"
										>
											<div className="h-32 w-full bg-stroke rounded-t-2xl mb-3" />
											<div className="px-4">
												<div className="h-4 w-2/3 bg-stroke rounded mb-2" />
												<div className="h-3 w-1/2 bg-stroke rounded" />
											</div>
										</div>
									))}
								</div>
							) : moments.length === 0 ? (
								<div className="text-text-muted">
									No moments for this event yet.
								</div>
							) : (
								<div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
									{moments.map((moment) => (
										<div key={moment.id} className="flex-shrink-0">
											<MomentCard moment={moment} compact={true} />
										</div>
									))}
								</div>
							)}
						</div>

						{/* Event Merch Section */}
						<div>
							<p className="text-md font-sans font-semibold mb-4 text-text-muted">
								Event Merch
							</p>
							{merchLoading ? (
								<div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
									{[1, 2, 3].map((i) => (
										<div
											key={i}
											className="flex-shrink-0 w-64 h-48 rounded-2xl bg-surface animate-pulse flex flex-col"
										>
											<div className="h-32 w-full bg-stroke rounded-t-2xl mb-3" />
											<div className="px-4">
												<div className="h-4 w-2/3 bg-stroke rounded mb-2" />
												<div className="h-3 w-1/2 bg-stroke rounded" />
											</div>
										</div>
									))}
								</div>
							) : merch.length === 0 ? (
								<div className="text-text-muted">
									No merch for this event yet.
								</div>
							) : (
								<div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
									{merch.map((item) => (
										<div key={item.id} className="flex-shrink-0">
											<MerchCard merch={item} compact={true} />
										</div>
									))}
								</div>
							)}
						</div>

						<hr className="mb-6 border-t border-stroke" />
						{/* Event Description Section */}
						<div className=" rounded-2xl bg-surface border border-stroke p-6">
							<h3 className="text-lg font-heading font-semibold mb-4 text-text">
								About this event
							</h3>
							<div className="text-text-muted font-manrope leading-relaxed">
								{event.description ? (
									<p>{event.description}</p>
								) : (
									<p className="text-text-muted italic">
										No description available for this event.
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
