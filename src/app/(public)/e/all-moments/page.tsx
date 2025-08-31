/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import MomentCard from "@/components/discover/MomentCard";
import { fetchPublicMoments } from "@/lib/firebase/queries/moment";
import { Spinner } from "@/components/ui/spinner";
import {
	getAuth,
	signInAnonymously,
	onAuthStateChanged,
	User,
} from "firebase/auth";

export default function AllMomentsPage() {
	const [loading, setLoading] = useState(true);
	const [authLoading, setAuthLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const [moments, setMoments] = useState<any[]>([]);
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
				const momentsData = await fetchPublicMoments();
				setMoments(momentsData);
			} catch (error) {
				console.error("Error fetching moments:", error);
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
			{/* Moments Masonry Grid */}
			{moments.length > 0 ? (
				<div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
					{moments.map((moment) => (
						<div key={moment.id} className="break-inside-avoid mb-6">
							<MomentCard moment={moment} autoHeight={true} />
						</div>
					))}
				</div>
			) : (
				<div className="text-center py-16">
					<div className="text-text-muted font-manrope text-lg mb-4">
						No moments found
					</div>
					<p className="text-text-muted">Check back later for new moments</p>
				</div>
			)}
		</main>
	);
}
