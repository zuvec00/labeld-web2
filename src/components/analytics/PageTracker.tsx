"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";
import { logPageVisit } from "@/lib/firebase/pageVisits";

const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

export default function PageTracker() {
	const pathname = usePathname();

	useEffect(() => {
		const handleTracking = () => {
			// Determine environment
			const environment =
				process.env.NODE_ENV === "production" ? "production" : "development";

			// Check cooldown
			const storageKey = `last_visit_studio-web_${pathname}`;
			const lastVisit = localStorage.getItem(storageKey);
			const now = Date.now();

			if (lastVisit && now - parseInt(lastVisit, 10) < COOLDOWN_MS) {
				return;
			}

			// Use onAuthStateChanged to ensure access to userId if logged in
			const unsubscribe = onAuthStateChanged(auth, (user) => {
				const userId = user ? user.uid : null;

				// Log visit
				logPageVisit({
					userId,
					url: window.location.href,
					path: pathname,
					platform: "studio-web",
					environment,
					userAgent: navigator.userAgent,
				});

				// Update local storage
				localStorage.setItem(storageKey, now.toString());

				// Unsubscribe immediately after logging for this path change
				unsubscribe();
			});
		};

		handleTracking();
	}, [pathname]);

	return null;
}
