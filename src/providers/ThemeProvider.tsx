"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "labeld-theme-preference";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	// Initialize with system preference or fallback to light
	const [theme, setThemeState] = useState<Theme>(() => {
		// SSR safe - will be properly set on client
		if (typeof window === "undefined") return "light";

		// Check localStorage first
		const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
		if (stored && (stored === "light" || stored === "dark")) {
			return stored;
		}

		// Use system preference
		const systemPrefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		return systemPrefersDark ? "dark" : "light";
	});
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);

		// Apply the theme immediately
		applyTheme(theme);

		// Listen for system preference changes
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (e: MediaQueryListEvent) => {
			// Only auto-switch if user hasn't manually set a preference
			const hasManualPreference = localStorage.getItem(THEME_STORAGE_KEY);
			if (!hasManualPreference) {
				const newTheme: Theme = e.matches ? "dark" : "light";
				setThemeState(newTheme);
				applyTheme(newTheme);
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [theme]);

	const applyTheme = (newTheme: Theme) => {
		const root = document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(newTheme);
	};

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
		applyTheme(newTheme);
		localStorage.setItem(THEME_STORAGE_KEY, newTheme);
	};

	const toggleTheme = () => {
		const newTheme: Theme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
	};

	// Prevent flash of unstyled content
	if (!mounted) {
		return <>{children}</>;
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
