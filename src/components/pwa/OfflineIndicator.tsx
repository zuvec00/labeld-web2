"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function OfflineIndicator() {
	const [isOnline, setIsOnline] = useState(true);
	const [showOffline, setShowOffline] = useState(false);

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			setShowOffline(false);
		};

		const handleOffline = () => {
			setIsOnline(false);
			setShowOffline(true);
		};

		// Set initial state
		setIsOnline(navigator.onLine);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	if (!showOffline && isOnline) {
		return null;
	}

	return (
		<div
			className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
				showOffline ? "translate-y-0" : "-translate-y-full"
			}`}
		>
			<div
				className={`p-3 text-center text-sm font-medium ${
					isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"
				}`}
			>
				<div className="flex items-center justify-center gap-2">
					{isOnline ? (
						<>
							<Wifi className="w-4 h-4" />
							Back online - Scanner synced
						</>
					) : (
						<>
							<WifiOff className="w-4 h-4" />
							Offline mode - Scans will sync when online
						</>
					)}
				</div>
			</div>
		</div>
	);
}
