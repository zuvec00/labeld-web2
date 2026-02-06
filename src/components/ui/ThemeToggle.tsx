"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export default function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			onClick={toggleTheme}
			className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface transition-colors border border-stroke"
			aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
			title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
		>
			{theme === "light" ? (
				<Moon className="w-4 h-4 text-text-muted" />
			) : (
				<Sun className="w-4 h-4 text-text-muted" />
			)}
		</button>
	);
}
