"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Moon, Sun, Monitor, X } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

const THEME_STORAGE_KEY = "labeld-theme-preference";
const THEME_NOTIFIED_KEY = "labeld-theme-notified";

export default function ThemeSelectionModal() {
	const { setTheme } = useTheme();
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		// Check if user has already been notified or has a preference
		const hasPreference = localStorage.getItem(THEME_STORAGE_KEY);
		const hasBeenNotified = localStorage.getItem(THEME_NOTIFIED_KEY);

		if (!hasPreference && !hasBeenNotified) {
			// Add a small delay for better UX
			const timer = setTimeout(() => setIsOpen(true), 1000);
			return () => clearTimeout(timer);
		}
	}, []);

	if (!mounted || !isOpen) return null;

	const handleSelect = (choice: "light" | "dark" | "system") => {
		if (choice === "system") {
			// For system, we remove the preference so it falls back to system
			localStorage.removeItem(THEME_STORAGE_KEY);
			// We need to trigger a re-evaluation in ThemeProvider, but currently ThemeProvider
			// doesn't export a "reset to system" function.
			// However, removing the key and reloading would work, or we can just explicitly set
			// the theme based on current system pref.
			// A better approach for "System" with the current ThemeProvider is to
			// determining the system theme and setting it, BUT keeping the key removed so it tracks system.
			// The current ThemeProvider implementation reads from localStorage on mount.
			// To properly support "System" without changing ThemeProvider too much,
			// we will just set the notified flag. The ThemeProvider defaults to system if no key.
			// So we actually DON'T want to call setTheme if it's system, because setTheme writes to localStorage.

			// Wait, looking at ThemeProvider:
			// const setTheme = (newTheme: Theme) => {
			//     setThemeState(newTheme);
			//     applyTheme(newTheme);
			//     localStorage.setItem(THEME_STORAGE_KEY, newTheme);
			// };

			// Logic for system:
			// Just mark as notified. The user is already on system default (mostly).
			// If they want to explicitly enforce system, they essentially just don't set a preference.
			// If they are currently on a different theme (unlikely if no preference), we might need to reset.
			// But since !hasPreference is the condition to show this, they ARE on system theme right now.
		} else {
			setTheme(choice);
		}

		localStorage.setItem(THEME_NOTIFIED_KEY, "true");
		setIsOpen(false);
	};

	const handleDismiss = () => {
		localStorage.setItem(THEME_NOTIFIED_KEY, "true");
		setIsOpen(false);
	};

	return createPortal(
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={handleDismiss}
			/>

			<div className="relative w-full max-w-md bg-bg border border-stroke rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
				<button
					onClick={handleDismiss}
					className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors"
				>
					<X className="w-5 h-5" />
				</button>

				<div className="mb-6 text-center">
					<h2 className="text-xl font-heading font-semibold mb-2">
						Choose your look
					</h2>
					<p className="text-text-muted text-sm leading-relaxed">
						We now support both light and dark modes. Select your preference
						below. You can always change this later by switching themes in your
						topbar.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
					{/* Light Mode */}
					<button
						onClick={() => handleSelect("light")}
						className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-3 p-4 rounded-xl border border-stroke hover:border-accent hover:bg-surface transition-all group"
					>
						<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
							<Sun className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
						</div>
						<span className="font-medium text-sm">Light</span>
					</button>

					{/* Dark Mode */}
					<button
						onClick={() => handleSelect("dark")}
						className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-3 p-4 rounded-xl border border-stroke hover:border-accent hover:bg-surface transition-all group"
					>
						<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
							<Moon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-200" />
						</div>
						<span className="font-medium text-sm">Dark</span>
					</button>

					{/* System */}
					<button
						onClick={() => handleSelect("system")}
						className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-3 p-4 rounded-xl border border-stroke hover:border-accent hover:bg-surface transition-all group"
					>
						<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-hover flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
							<Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-text" />
						</div>
						<span className="font-medium text-sm">System</span>
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
}
