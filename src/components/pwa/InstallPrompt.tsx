"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

export default function InstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [showPrompt, setShowPrompt] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		// Check if app is already installed
		const checkInstalled = () => {
			if (window.matchMedia("(display-mode: standalone)").matches) {
				setIsInstalled(true);
				return;
			}

			// Check if running in iOS Safari
			const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
			const isInStandaloneMode =
				"standalone" in window.navigator &&
				(window.navigator as any).standalone;

			if (isIOS && !isInStandaloneMode) {
				setShowPrompt(true);
			}
		};

		checkInstalled();

		// Listen for beforeinstallprompt event (Android Chrome)
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setShowPrompt(true);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		// Check if user has dismissed the prompt before
		const dismissed = localStorage.getItem("pwa-install-dismissed");
		if (dismissed) {
			const dismissTime = parseInt(dismissed);
			const daysSinceDismiss =
				(Date.now() - dismissTime) / (1000 * 60 * 60 * 24);

			// Show again after 7 days
			if (daysSinceDismiss < 7) {
				setShowPrompt(false);
			}
		}

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt
			);
		};
	}, []);

	const handleInstall = async () => {
		if (deferredPrompt) {
			// Android Chrome
			deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;

			if (outcome === "accepted") {
				console.log("[PWA] User accepted the install prompt");
			} else {
				console.log("[PWA] User dismissed the install prompt");
			}

			setDeferredPrompt(null);
			setShowPrompt(false);
		} else {
			// iOS Safari - show instructions
			setShowPrompt(false);
		}
	};

	const handleDismiss = () => {
		setShowPrompt(false);
		localStorage.setItem("pwa-install-dismissed", Date.now().toString());
	};

	// Don't show if already installed or prompt dismissed
	if (isInstalled || !showPrompt) {
		return null;
	}

	return (
		<div className="fixed bottom-4 left-4 right-4 z-50 bg-surface border border-stroke rounded-lg shadow-lg p-4">
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0 w-10 h-10 bg-cta rounded-lg flex items-center justify-center">
					<Smartphone className="w-5 h-5 text-text" />
				</div>

				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-text mb-1">Install Labeld Scanner</h3>
					<p className="text-sm text-text-muted mb-3">
						{deferredPrompt
							? "Install the app for quick access to the scanner"
							: "Add to home screen for quick access to the scanner"}
					</p>

					<div className="flex gap-2">
						<button
							onClick={handleInstall}
							className="flex items-center gap-2 px-3 py-2 bg-cta text-text rounded-lg text-sm font-medium hover:bg-cta/90 transition-colors"
						>
							<Download className="w-4 h-4" />
							{deferredPrompt ? "Install" : "Add to Home Screen"}
						</button>

						<button
							onClick={handleDismiss}
							className="px-3 py-2 text-text-muted hover:text-text text-sm transition-colors"
						>
							Not now
						</button>
					</div>
				</div>

				<button
					onClick={handleDismiss}
					className="flex-shrink-0 p-1 text-text-muted hover:text-text transition-colors"
				>
					<X className="w-4 h-4" />
				</button>
			</div>

			{!deferredPrompt && (
				<div className="mt-3 pt-3 border-t border-stroke">
					<p className="text-xs text-text-muted">
						<strong>iOS:</strong> Tap the share button{" "}
						<span className="inline-block w-4 h-4 bg-text-muted rounded mx-1"></span>
						and select "Add to Home Screen"
					</p>
				</div>
			)}
		</div>
	);
}
