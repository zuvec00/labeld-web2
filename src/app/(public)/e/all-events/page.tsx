/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import EventCard from "@/components/discover/EventCard";
import { fetchPublishedEvents } from "@/lib/firebase/queries/event";
import { Spinner } from "@/components/ui/spinner";
import {
	getAuth,
	signInAnonymously,
	onAuthStateChanged,
	User,
} from "firebase/auth";

export default function AllEventsPage() {
	const [loading, setLoading] = useState(true);
	const [authLoading, setAuthLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const [events, setEvents] = useState<any[]>([]);
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
				const eventsData = await fetchPublishedEvents();
				setEvents(eventsData);
			} catch (error) {
				console.error("Error fetching events:", error);
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
		<main className="container mx-auto px-10 sm:px-10 lg:px-10 py-8">
			{/* Page Header */}
			{/* <div className="mb-8">
					<h1 className="text-3xl md:text-4xl font-heading font-bold text-text mb-4">
						All Events
					</h1>
					<p className="text-text-muted font-manrope">
						Discover all upcoming events from the Labeld community
					</p>
				</div> */}

			{/* Events Grid */}
			{events.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{events.map((event) => (
						<div key={event.id} className="w-full">
							<EventCard event={event} />
						</div>
					))}
				</div>
			) : (
				<div className="text-center py-16">
					<div className="text-text-muted font-manrope text-lg mb-4">
						No events found
					</div>
					<p className="text-text-muted">
						Check back later for upcoming events
					</p>
				</div>
			)}
		</main>
	);
}
