import { useState, useEffect } from "react";

type NetworkStatus = "online" | "offline" | "poor";

export function useNetworkStatus(): NetworkStatus {
	// Initialize with online first to avoid flash during hydration
	const [status, setStatus] = useState<NetworkStatus>("online");

	useEffect(() => {
		// Only run on client
		if (typeof window === "undefined") return;

		const updateStatus = () => {
			if (!navigator.onLine) {
				setStatus("offline");
				return;
			}

			// Check for poor connection if supported
			const connection = (navigator as any).connection;
			if (connection) {
				// effectiveType is experimental but widely supported in Chromium
				// 'slow-2g', '2g', '3g', or '4g'
				if (
					connection.saveData ||
					connection.effectiveType === "slow-2g" ||
					connection.effectiveType === "2g"
				) {
					setStatus("poor");
					return;
				}
			}

			setStatus("online");
		};

		window.addEventListener("online", updateStatus);
		window.addEventListener("offline", updateStatus);

		const connection = (navigator as any).connection;
		if (connection) {
			connection.addEventListener("change", updateStatus);
		}

		// Initial check
		updateStatus();

		return () => {
			window.removeEventListener("online", updateStatus);
			window.removeEventListener("offline", updateStatus);
			if (connection) {
				connection.removeEventListener("change", updateStatus);
			}
		};
	}, []);

	return status;
}
