/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import {
	getAuth,
	signInAnonymously,
	onAuthStateChanged,
	User,
} from "firebase/auth";
import EventsNavbar from "@/components/events/navbar";
import { Instagram } from "lucide-react";

export default function EventsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [authLoading, setAuthLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
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

	return (
		<div className="min-h-screen bg-bg text-text">
			{/* Persistent Header */}
			<EventsNavbar />

			{/* Page Content */}
			{children}

			{/* Footer */}
			<footer className="border-t border-gray-800 mt-16 bg-cta text-text">
				<div className="container mx-auto px-10 sm:px-10 lg:px-10 py-6">
					<div className="flex flex-col md:flex-row items-center justify-between">
						<div className=" font-manrope">© Labeld 2025</div>
						<div className="flex items-center space-x-6 mt-4 md:mt-0">
							<a href="#" className=" hover:text-[#C6FF00] transition-colors">
								<Instagram className="h-5 w-5" />
							</a>
							<a href="#" className=" hover:text-[#C6FF00] transition-colors">
								<svg
									className="h-5 w-5"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
								</svg>
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
