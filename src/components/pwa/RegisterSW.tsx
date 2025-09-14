"use client";

import { useEffect, useState } from "react";

interface SWRegistration {
	registration: ServiceWorkerRegistration | null;
	updateAvailable: boolean;
	updateServiceWorker: () => void;
}

export default function RegisterSW() {
	const [swState, setSwState] = useState<SWRegistration>({
		registration: null,
		updateAvailable: false,
		updateServiceWorker: () => {},
	});

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!("serviceWorker" in navigator)) {
			console.log("[PWA] Service Worker not supported");
			return;
		}

		const registerSW = async () => {
			try {
				console.log("[PWA] Registering service worker...");

				const registration = await navigator.serviceWorker.register("/sw.js", {
					scope: "/",
				});

				console.log(
					"[PWA] Service Worker registered successfully:",
					registration
				);

				setSwState((prev) => ({
					...prev,
					registration,
				}));

				// Handle updates
				registration.addEventListener("updatefound", () => {
					console.log("[PWA] New service worker found");

					const newWorker = registration.installing;
					if (!newWorker) return;

					newWorker.addEventListener("statechange", () => {
						if (
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							console.log(
								"[PWA] New service worker installed, update available"
							);
							setSwState((prev) => ({
								...prev,
								updateAvailable: true,
								updateServiceWorker: () => {
									newWorker.postMessage({ action: "skipWaiting" });
									window.location.reload();
								},
							}));
						}
					});
				});

				// Handle controller change (when new SW takes control)
				navigator.serviceWorker.addEventListener("controllerchange", () => {
					console.log("[PWA] Service worker controller changed");
					window.location.reload();
				});

				// Listen for messages from service worker
				navigator.serviceWorker.addEventListener("message", (event) => {
					if (event.data && event.data.type === "CACHE_UPDATED") {
						console.log("[PWA] Cache updated:", event.data.payload);
					}
				});
			} catch (error) {
				console.error("[PWA] Service Worker registration failed:", error);
			}
		};

		// Register after page load to not block initial render
		if (document.readyState === "complete") {
			registerSW();
		} else {
			window.addEventListener("load", registerSW);
		}

		return () => {
			window.removeEventListener("load", registerSW);
		};
	}, []);

	// Show update notification if available
	if (swState.updateAvailable) {
		return (
			<div className="fixed bottom-4 left-4 right-4 z-50 bg-cta text-text p-4 rounded-lg shadow-lg">
				<div className="flex items-center justify-between">
					<div>
						<p className="font-medium">App Update Available</p>
						<p className="text-sm opacity-90">
							A new version is ready to install
						</p>
					</div>
					<button
						onClick={swState.updateServiceWorker}
						className="ml-4 px-4 py-2 bg-background text-cta rounded-lg font-medium hover:bg-background/90 transition-colors"
					>
						Update
					</button>
				</div>
			</div>
		);
	}

	return null;
}

// Hook to get service worker state
export function useServiceWorker() {
	const [isOnline, setIsOnline] = useState(true);
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		// Check online status
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		// Check if app is installed
		const checkInstalled = () => {
			if (window.matchMedia("(display-mode: standalone)").matches) {
				setIsInstalled(true);
			}
		};

		checkInstalled();
		window.addEventListener("resize", checkInstalled);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
			window.removeEventListener("resize", checkInstalled);
		};
	}, []);

	return {
		isOnline,
		isInstalled,
	};
}
